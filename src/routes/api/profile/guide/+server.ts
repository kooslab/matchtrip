import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guideProfiles, fileUploads } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendGuideOnboardingEmail } from '$lib/server/email/guideOnboarding';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { devImageStorage } from '$lib/server/devImageStorage';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
const R2_PUBLIC_BUCKET_NAME = env.R2_PUBLIC_BUCKET_NAME;
const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

let r2Client: S3Client | null = null;

// Initialize R2 client only if credentials are available
if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
	r2Client = new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY
		},
		forcePathStyle: true
	});
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
	}

	try {
		const formData = await request.formData();

		// Extract form fields
		const name = formData.get('name')?.toString();
		const phone = formData.get('phone')?.toString();
		const nickname = formData.get('nickname')?.toString();
		const frequentArea = formData.get('frequentArea')?.toString();
		const birthDate = formData.get('birthDate')?.toString();
		const destinationsStr = formData.get('destinations')?.toString();
		const profileImageUrl = formData.get('profileImageUrl')?.toString();

		let destinations: string[] = [];
		if (destinationsStr) {
			try {
				destinations = JSON.parse(destinationsStr);
			} catch (e) {
				console.error('Error parsing destinations:', e);
			}
		}

		// Handle file uploads
		const documentUrls: Record<string, string[]> = {};
		let idDocumentUrl: string | null = null;
		const certificationUrls: string[] = [];

		// Process file uploads
		for (const [key, value] of formData.entries()) {
			if (key.startsWith('documents_') && value instanceof File) {
				const categoryId = key.replace('documents_', '');

				try {
					// Generate unique filename
					const timestamp = Date.now();
					const randomString = Math.random().toString(36).substring(2, 15);
					const extension = value.name.split('.').pop();
					const filename = `guide-document-${categoryId}/${timestamp}-${randomString}.${extension}`;

					// Convert file to buffer
					const buffer = await value.arrayBuffer();

					let fileUrl: string;

					// Upload to R2 if configured
					if (r2Client && R2_BUCKET_NAME) {
						const bucketName = R2_BUCKET_NAME; // Guide documents go to private bucket

						const uploadCommand = new PutObjectCommand({
							Bucket: bucketName,
							Key: filename,
							Body: new Uint8Array(buffer),
							ContentType: value.type,
							ContentLength: value.size
						});

						await r2Client.send(uploadCommand);

						// Use API endpoint for private bucket files
						fileUrl = `/api/images/${filename}`;
					} else if (dev) {
						// For development, store in memory
						console.log('[Guide Upload] Storing in dev storage:', filename);
						devImageStorage.set(filename, { buffer, contentType: value.type });
						fileUrl = `/api/images/${filename}`;
					} else {
						throw new Error('Storage not configured');
					}

					// Organize URLs by category
					if (!documentUrls[categoryId]) {
						documentUrls[categoryId] = [];
					}
					documentUrls[categoryId].push(fileUrl);

					// Store specific document types
					if (categoryId === 'identity') {
						idDocumentUrl = fileUrl;
					} else if (
						categoryId === 'guide-license' ||
						categoryId === 'license-certification' ||
						categoryId === 'insurance'
					) {
						certificationUrls.push(fileUrl);
					}

					// Track file upload in database
					await db.insert(fileUploads).values({
						userId,
						filename: filename,
						originalName: value.name,
						fileType: value.type,
						fileSize: value.size,
						uploadType: `guide-document-${categoryId}`,
						url: fileUrl
					});
				} catch (uploadError) {
					console.error(`Failed to upload file for category ${categoryId}:`, uploadError);
				}
			}
		}

		console.log(
			'Uploaded documents:',
			Object.keys(documentUrls).map((cat) => `${cat}: ${documentUrls[cat].length} files`)
		);

		// Create or update guide profile
		const existingProfile = await db
			.select()
			.from(guideProfiles)
			.where(eq(guideProfiles.userId, userId))
			.limit(1);

		const profileData: any = {
			username: nickname,
			currentLocation: frequentArea,
			activityAreas: destinations,
			profileImageUrl: profileImageUrl,
			idDocumentUrl: idDocumentUrl,
			certificationUrls: certificationUrls
		};

		if (existingProfile.length > 0) {
			// Update existing profile
			await db
				.update(guideProfiles)
				.set({
					...profileData,
					updatedAt: new Date()
				})
				.where(eq(guideProfiles.userId, userId));
		} else {
			// Create new profile
			await db.insert(guideProfiles).values({
				userId,
				...profileData
			});

			// Send onboarding confirmation email
			try {
				await sendGuideOnboardingEmail({
					guideName: locals.user?.name || nickname || 'Guide',
					guideEmail: locals.user?.email || '',
					submittedAt: new Date()
				});
			} catch (emailError) {
				// Log error but don't fail the request
				console.error('Failed to send onboarding email:', emailError);
			}
		}

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		console.error('Guide profile error:', err);
		return new Response(JSON.stringify({ success: false, error: 'DB error' }), { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
	}

	try {
		const body = await request.json();
		const { introduction, profileImageUrl, username, location, activityAreas } = body;

		const updateData: any = {};
		if (introduction !== undefined) updateData.introduction = introduction;
		if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
		if (username !== undefined) updateData.username = username;
		if (location !== undefined) updateData.currentLocation = location;
		if (activityAreas !== undefined) updateData.activityAreas = activityAreas;

		await db
			.update(guideProfiles)
			.set({
				...updateData,
				updatedAt: new Date()
			})
			.where(eq(guideProfiles.userId, userId));

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		console.error('Guide profile update error:', err);
		return new Response(JSON.stringify({ success: false, error: 'DB error' }), { status: 500 });
	}
};

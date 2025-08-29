import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guideProfiles, fileUploads, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '$lib/server/encryption';
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
	const startTime = Date.now();
	console.log('[API GUIDE PROFILE] Request received at', new Date().toISOString());

	const userId = locals.user?.id;
	if (!userId) {
		console.error('[API GUIDE PROFILE] No user ID in locals');
		return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
	}
	console.log('[API GUIDE PROFILE] User ID:', userId);

	try {
		// Check content type
		const contentType = request.headers.get('content-type') || '';
		console.log('[API GUIDE PROFILE] Content type:', contentType);

		// Handle JSON requests (from profile updates)
		if (contentType.includes('application/json')) {
			console.log('[API GUIDE PROFILE] Processing JSON request');
			const body = await request.json();
			const { introduction, profileImageUrl } = body;

			// Update existing profile
			await db
				.update(guideProfiles)
				.set({
					introduction,
					profileImageUrl,
					updatedAt: new Date()
				})
				.where(eq(guideProfiles.userId, userId));

			return new Response(JSON.stringify({ success: true }));
		}

		// Handle FormData (from onboarding)
		console.log('[API GUIDE PROFILE] Processing FormData request');
		const formData = await request.formData();

		// Extract form fields
		const name = formData.get('name')?.toString();
		const phone = formData.get('phone')?.toString();
		const countryCode = formData.get('countryCode')?.toString();
		const nickname = formData.get('nickname')?.toString();
		const frequentArea = formData.get('frequentArea')?.toString();
		const birthDate = formData.get('birthDate')?.toString();
		const destinationsStr = formData.get('destinations')?.toString();
		const profileImageUrl = formData.get('profileImageUrl')?.toString();
		const bio = formData.get('bio')?.toString() || ''; // Handle bio/introduction field

		console.log('[API GUIDE PROFILE] Form data received:', {
			hasName: !!name,
			hasPhone: !!phone,
			hasNickname: !!nickname,
			hasFrequentArea: !!frequentArea,
			hasBirthDate: !!birthDate,
			hasDestinations: !!destinationsStr,
			hasProfileImage: !!profileImageUrl
		});

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
		let fileCount = 0;
		for (const [key, value] of formData.entries()) {
			if (key.startsWith('documents_') && value instanceof File) {
				const categoryId = key.replace('documents_', '');
				fileCount++;
				console.log(
					`[API GUIDE PROFILE] Processing file ${fileCount} for category ${categoryId}, size: ${value.size} bytes`
				);

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

		console.log('[API GUIDE PROFILE] File upload summary:', {
			totalFiles: fileCount,
			documentsByCategory: Object.keys(documentUrls).map(
				(cat) => `${cat}: ${documentUrls[cat].length} files`
			),
			hasIdDocument: !!idDocumentUrl,
			certificationCount: certificationUrls.length
		});

		// Update user's basic information if provided
		const userUpdates: any = {};
		if (name) {
			const encryptedName = encrypt(name) || name;
			userUpdates.name = encryptedName;
		}
		if (phone) {
			const encryptedPhone = encrypt(phone) || phone;
			userUpdates.phone = encryptedPhone;
		}
		if (countryCode) {
			userUpdates.countryCode = countryCode;
		}
		if (birthDate) {
			userUpdates.birthDate = birthDate;
		}

		if (Object.keys(userUpdates).length > 0) {
			userUpdates.updatedAt = new Date();
			await db.update(users).set(userUpdates).where(eq(users.id, userId));
			console.log('[API GUIDE PROFILE] Updated user basic information');
		}

		// Create or update guide profile
		console.log('[API GUIDE PROFILE] Checking for existing profile');
		const existingProfile = await db
			.select()
			.from(guideProfiles)
			.where(eq(guideProfiles.userId, userId))
			.limit(1);
		console.log('[API GUIDE PROFILE] Existing profile found:', existingProfile.length > 0);

		const profileData: any = {
			username: nickname,
			currentLocation: frequentArea,
			activityAreas: destinations,
			profileImageUrl: profileImageUrl,
			idDocumentUrl: idDocumentUrl,
			certificationUrls: certificationUrls,
			introduction: bio // Save bio as introduction field
		};

		if (existingProfile.length > 0) {
			// Update existing profile
			console.log('[API GUIDE PROFILE] Updating existing profile');
			await db
				.update(guideProfiles)
				.set({
					...profileData,
					updatedAt: new Date()
				})
				.where(eq(guideProfiles.userId, userId));
			console.log('[API GUIDE PROFILE] Profile updated successfully');
		} else {
			// Create new profile
			console.log('[API GUIDE PROFILE] Creating new profile');
			await db.insert(guideProfiles).values({
				userId,
				...profileData
			});
			console.log('[API GUIDE PROFILE] Profile created successfully');

			// Send onboarding confirmation email
			try {
				console.log('[API GUIDE PROFILE] Sending onboarding email');
				await sendGuideOnboardingEmail({
					guideName: locals.user?.name || nickname || 'Guide',
					guideEmail: locals.user?.email || '',
					submittedAt: new Date()
				});
				console.log('[API GUIDE PROFILE] Email sent successfully');
			} catch (emailError) {
				// Log error but don't fail the request
				console.error('[API GUIDE PROFILE] Failed to send onboarding email:', emailError);
			}
		}

		const totalTime = Date.now() - startTime;
		console.log(`[API GUIDE PROFILE] Request completed successfully in ${totalTime}ms`);
		return new Response(JSON.stringify({ success: true, time: totalTime }));
	} catch (err) {
		const totalTime = Date.now() - startTime;
		console.error('[API GUIDE PROFILE] Error:', {
			message: err.message,
			stack: err.stack,
			time: totalTime
		});
		return new Response(
			JSON.stringify({
				success: false,
				error: err.message || 'DB error',
				time: totalTime
			}),
			{ status: 500 }
		);
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

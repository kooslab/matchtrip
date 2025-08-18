import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { devImageStorage } from '$lib/server/devImageStorage';
import { db } from '$lib/server/db';
import { fileUploads } from '$lib/server/db/schema';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME; // Primary private bucket - ALWAYS use this
const R2_PUBLIC_BUCKET_NAME = env.R2_PUBLIC_BUCKET_NAME; // Required for destination images
const R2_PUBLIC_URL = env.R2_PUBLIC_URL; // Required for destination images

// IMPORTANT: Use public bucket ONLY for destination images (approved exception)
// All other uploads use private bucket for security and consistency

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
		// Required for R2 compatibility
		forcePathStyle: true
	});
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const type = formData.get('type') as string;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file size (5MB limit - should already be resized on client)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			return json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 });
		}

		// Validate file type based on upload type
		const imageTypes = ['image/jpeg', 'image/png'];
		const documentTypes = [
			'application/pdf',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
			'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // XLSX
		];
		const allowedTypes = type === 'destination' ? imageTypes : [...imageTypes, ...documentTypes];

		if (!allowedTypes.includes(file.type)) {
			const allowedFormats =
				type === 'destination' ? 'JPG, JPEG, PNG' : 'PDF, JPG, JPEG, PNG, DOCX, PPTX, XLSX';
			return json(
				{ error: `Invalid file type. Only ${allowedFormats} files are allowed.` },
				{ status: 400 }
			);
		}

		// Generate unique filename
		const timestamp = Date.now();
		const randomString = Math.random().toString(36).substring(2, 15);
		const extension = file.name.split('.').pop();
		const filename = `${type}/${timestamp}-${randomString}.${extension}`;

		// Convert file to buffer
		const buffer = await file.arrayBuffer();

		// Upload to R2 if configured, otherwise use mock
		if (r2Client) {
			try {
				// RULE: Use public bucket ONLY for destination images (approved exception)
				// All other files use private bucket for security
				let bucketName: string;
				let usePublicBucket = false;

				if (type === 'destination' && R2_PUBLIC_BUCKET_NAME) {
					bucketName = R2_PUBLIC_BUCKET_NAME;
					usePublicBucket = true;
					console.log('[Upload] Using public bucket for destination image:', filename);
				} else {
					bucketName = R2_BUCKET_NAME!;
					console.log('[Upload] Using private bucket for:', filename);
				}

				if (!bucketName) {
					const bucketType = usePublicBucket ? 'public' : 'private';
					throw new Error(`${bucketType} bucket not configured`);
				}

				const uploadCommand = new PutObjectCommand({
					Bucket: bucketName,
					Key: filename,
					Body: new Uint8Array(buffer),
					ContentType: file.type,
					ContentLength: file.size
				});

				await r2Client.send(uploadCommand);

				// ALWAYS return the private API endpoint URL
				// This ensures all images go through authentication/presigned URL generation
				// Generate URL based on bucket type
				let publicUrl: string;
				if (usePublicBucket && R2_PUBLIC_URL) {
					// Direct public R2 URL for destination images
					publicUrl = `${R2_PUBLIC_URL}/${filename}`;
				} else if (usePublicBucket && R2_ACCOUNT_ID) {
					// Fallback public URL construction
					publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${filename}`;
				} else {
					// Private bucket - served through API endpoint
					publicUrl = `/api/images/${filename}`;
				}

				// Track file upload in database if user is authenticated
				if (locals.user?.id) {
					await db.insert(fileUploads).values({
						userId: locals.user.id,
						filename: filename,
						originalName: file.name,
						fileType: file.type,
						fileSize: file.size,
						uploadType: type,
						url: publicUrl
					});
				}

				return json({
					success: true,
					url: publicUrl,
					filename: filename,
					isPrivate: !usePublicBucket
				});
			} catch (uploadError) {
				console.error('R2 upload error:', uploadError);
				// Fall back to mock URL if R2 upload fails
			}
		}

		// Fallback: For development without R2
		console.warn('R2 not configured, using in-memory storage for development');

		// Store in memory for development
		if (dev) {
			console.log('[Upload] Storing in dev storage:', filename);
			devImageStorage.set(filename, { buffer, contentType: file.type });
			console.log('[Upload] Dev storage now has:', devImageStorage.size, 'images');

			// Track file upload in database if user is authenticated
			if (locals.user?.id) {
				await db.insert(fileUploads).values({
					userId: locals.user.id,
					filename: filename,
					originalName: file.name,
					fileType: file.type,
					fileSize: file.size,
					uploadType: type,
					url: `/api/images/${filename}`
				});
			}

			// Return the secure endpoint URL
			return json({
				success: true,
				url: `/api/images/${filename}`,
				filename: filename,
				isDevelopment: true
			});
		}

		// If not in dev and no R2, return error
		return json({ error: 'Image storage not configured' }, { status: 500 });
	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Upload failed' }, { status: 500 });
	}
};

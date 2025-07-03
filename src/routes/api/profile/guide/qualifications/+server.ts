import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { devImageStorage } from '$lib/server/devImageStorage';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;

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
	// Check authentication
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const uploadedFiles: Record<string, string> = {};

		// Process each file
		const fileFields = ['guideCertificate', 'driverLicense', 'vehicleInsurance', 'idDocument'];
		
		for (const field of fileFields) {
			const file = formData.get(field) as File;
			
			if (file && file.size > 0) {
				// Generate unique filename
				const fileExt = file.name.split('.').pop();
				const timestamp = Date.now();
				const randomStr = Math.random().toString(36).substring(2, 15);
				const fileName = `guide-qualifications/${locals.user.id}/${field}-${timestamp}-${randomStr}.${fileExt}`;
				
				// Validate file size (10MB limit)
				const maxSize = 10 * 1024 * 1024; // 10MB
				if (file.size > maxSize) {
					return json({ error: `${field}: File too large. Maximum size is 10MB.` }, { status: 400 });
				}

				// Convert file to buffer
				const arrayBuffer = await file.arrayBuffer();
				const buffer = new Uint8Array(arrayBuffer);
				
				// Upload to R2 if configured
				if (r2Client && R2_BUCKET_NAME) {
					try {
						const uploadCommand = new PutObjectCommand({
							Bucket: R2_BUCKET_NAME, // Use private bucket for qualifications
							Key: fileName,
							Body: buffer,
							ContentType: file.type,
							ContentLength: file.size
						});

						await r2Client.send(uploadCommand);
						
						// Store only the R2 key/path, not a URL
						// These files are private and should not be accessible via any public URL
						uploadedFiles[field] = fileName;
					} catch (uploadError) {
						console.error('R2 upload error for', field, ':', uploadError);
						throw uploadError;
					}
				} else if (dev) {
					// Development mode: use in-memory storage
					console.log('[Qualifications] Storing in dev storage:', fileName);
					devImageStorage.set(fileName, { buffer: Buffer.from(buffer), contentType: file.type });
					// Store only the filename, not a URL
					uploadedFiles[field] = fileName;
				} else {
					return json({ error: 'Storage not configured' }, { status: 500 });
				}
			}
		}

		// Update guide profile with qualification file paths (not URLs)
		// These are private files and should never be directly accessible
		// Access control will be implemented later for admin users
		await db
			.update(guideProfiles)
			.set({
				qualifications: uploadedFiles,
				updatedAt: new Date()
			})
			.where(eq(guideProfiles.userId, locals.user.id));

		return json({ success: true, message: 'Files uploaded successfully' });
	} catch (error) {
		console.error('Error uploading qualifications:', error);
		return json({ error: 'Failed to upload files' }, { status: 500 });
	}
};
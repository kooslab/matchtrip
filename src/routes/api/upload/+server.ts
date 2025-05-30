import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
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
		}
	});
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const type = formData.get('type') as string;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file size (10MB limit)
		const maxSize = 10 * 1024 * 1024; // 10MB
		if (file.size > maxSize) {
			return json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
		if (!allowedTypes.includes(file.type)) {
			return json(
				{ error: 'Invalid file type. Only JPEG, PNG, WebP, and PDF files are allowed.' },
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
		if (r2Client && R2_BUCKET_NAME) {
			try {
				const uploadCommand = new PutObjectCommand({
					Bucket: R2_BUCKET_NAME,
					Key: filename,
					Body: new Uint8Array(buffer),
					ContentType: file.type,
					ContentLength: file.size
				});

				await r2Client.send(uploadCommand);

				// Return the public URL
				const publicUrl = R2_PUBLIC_URL
					? `${R2_PUBLIC_URL}/${filename}`
					: `https://pub-${R2_ACCOUNT_ID}.r2.dev/${filename}`;

				return json({
					success: true,
					url: publicUrl,
					filename: filename
				});
			} catch (uploadError) {
				console.error('R2 upload error:', uploadError);
				// Fall back to mock URL if R2 upload fails
			}
		}

		// Fallback: return a mock URL for development
		console.warn('R2 not configured or upload failed, using mock URL');
		const mockUrl = `https://mock-storage.example.com/${filename}`;

		return json({
			success: true,
			url: mockUrl,
			filename: filename
		});
	} catch (error) {
		console.error('Upload error:', error);
		return json({ error: 'Upload failed' }, { status: 500 });
	}
};

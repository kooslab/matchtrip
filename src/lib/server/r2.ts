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
		}
	});
}

export async function uploadToR2(
	file: File,
	type: string
): Promise<{ url: string; key: string }> {
	// Generate unique filename
	const timestamp = Date.now();
	const randomString = Math.random().toString(36).substring(2, 15);
	const extension = file.name.split('.').pop();
	const filename = `${type}/${timestamp}-${randomString}.${extension}`;

	// Convert file to buffer
	const buffer = await file.arrayBuffer();

	// Upload to R2 if configured, otherwise use mock
	if (r2Client) {
		// Use public bucket for destination and guide profile images, private bucket for others
		const isPublic =
			type === 'destination' ||
			type === 'guide-profile' ||
			type === 'traveler-profile' ||
			type === 'content' ||
			type === 'product-message';
		// If marked as public but no public bucket, still use private bucket but generate public URL
		const bucketName = isPublic && R2_PUBLIC_BUCKET_NAME ? R2_PUBLIC_BUCKET_NAME : R2_BUCKET_NAME;
		const uploadedToPublicBucket = bucketName === R2_PUBLIC_BUCKET_NAME;

		if (!bucketName) {
			throw new Error('Bucket name not configured');
		}

		const uploadCommand = new PutObjectCommand({
			Bucket: bucketName,
			Key: filename,
			Body: new Uint8Array(buffer),
			ContentType: file.type
		});

		await r2Client.send(uploadCommand);

		// Note: File upload tracking should be done by the caller since it requires userId

		// Generate URL for public access
		const url = uploadedToPublicBucket
			? `${R2_PUBLIC_URL}/${filename}`
			: `/api/images/${filename}`;

		return { url, key: filename };
	} else {
		// Development mock
		if (dev) {
			devImageStorage.set(filename, { buffer, contentType: file.type });
			return { url: `/api/images/${filename}`, key: filename };
		}
		throw new Error('R2 client not configured');
	}
}
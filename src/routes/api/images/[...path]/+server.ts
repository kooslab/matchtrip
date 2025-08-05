import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { devImageStorage } from '$lib/server/devImageStorage';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
const R2_PUBLIC_BUCKET_NAME = env.R2_PUBLIC_BUCKET_NAME;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
	'http://localhost:5173',
	'http://localhost:5174',
	'https://matchtrip.net',
	'https://www.matchtrip.net',
	'https://dev.matchtrip.net'
];

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
	console.log('[Image API] R2 client initialized with account:', R2_ACCOUNT_ID);
} else {
	console.log('[Image API] R2 client not initialized - missing credentials');
}

export const GET: RequestHandler = async ({ params, request, locals }) => {
	try {
		const imagePath = params.path;

		// Check origin
		const origin = request.headers.get('origin') || request.headers.get('referer');
		const isAllowedOrigin = origin && ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));

		// In development, always allow. In production, check origin
		if (!dev && !isAllowedOrigin) {
			throw error(403, 'Forbidden');
		}

		// Check if user is authenticated for private images
		if (imagePath?.includes('traveler-profile') && !locals.user) {
			throw error(401, 'Unauthorized');
		}

		// If R2 is configured, generate presigned URL
		if (r2Client && (R2_BUCKET_NAME || R2_PUBLIC_BUCKET_NAME)) {
			// Determine which bucket to use based on the image type
			const isPublicImage =
				imagePath?.includes('destination/') || imagePath?.includes('guide-profile/') || imagePath?.includes('content/');
			const bucketName =
				isPublicImage && R2_PUBLIC_BUCKET_NAME ? R2_PUBLIC_BUCKET_NAME : R2_BUCKET_NAME;

			if (!bucketName) {
				throw error(500, 'No bucket configured');
			}

			const command = new GetObjectCommand({
				Bucket: bucketName,
				Key: imagePath
			});

			try {
				// Generate presigned URL with 1 hour expiration
				const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

				// Redirect to the presigned URL
				throw redirect(302, presignedUrl);
			} catch (r2Error: any) {
				// If it's a redirect (which is what we want), re-throw it
				if (r2Error?.status === 302 || r2Error?.constructor?.name === 'Redirect') {
					throw r2Error;
				}

				// Otherwise, it's an actual error
				console.error('R2 presigned URL error:', r2Error);

				// Check if it's an AWS SDK error
				if (r2Error?.$metadata) {
					console.error('AWS SDK Error:', {
						name: r2Error.name,
						message: r2Error.message,
						metadata: r2Error.$metadata
					});
				}

				// Extract error message
				const errorMessage = r2Error?.message || r2Error?.toString() || 'Unknown error';
				throw error(500, `Failed to generate presigned URL: ${errorMessage}`);
			}
		}

		// For development without R2, check in-memory storage
		if (dev && imagePath) {
			const storedImage = devImageStorage.get(imagePath);
			if (storedImage) {
				return new Response(storedImage.buffer, {
					status: 200,
					headers: {
						'Content-Type': storedImage.contentType,
						'Cache-Control': 'private, max-age=3600',
						'Access-Control-Allow-Origin': origin || 'http://localhost:5173'
					}
				});
			}
		}

		throw error(404, 'Image not found');
	} catch (err: any) {
		// If it's a redirect, let it through
		if (err?.status === 302 || err?.constructor?.name === 'Redirect') {
			throw err;
		}

		// If it's already an HTTP error, re-throw it
		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		console.error('Image serving error:', err);
		throw error(500, 'Internal server error');
	}
};

// Handle preflight requests
export const OPTIONS: RequestHandler = async ({ request }) => {
	const origin = request.headers.get('origin') || request.headers.get('referer');
	const isAllowedOrigin = origin && ALLOWED_ORIGINS.some((allowed) => origin.startsWith(allowed));

	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': dev || isAllowedOrigin ? origin || '*' : '',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400'
		}
	});
};

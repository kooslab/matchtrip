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
	'https://www.matchtrip.net'
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
		}
	});
}

export const GET: RequestHandler = async ({ params, request, locals }) => {
	try {
		const imagePath = params.path;
		console.log('[Image API] Request for:', imagePath);
		console.log('[Image API] R2 Config:', {
			hasClient: !!r2Client,
			hasPrivateBucket: !!R2_BUCKET_NAME,
			hasPublicBucket: !!R2_PUBLIC_BUCKET_NAME,
			privateBucket: R2_BUCKET_NAME,
			publicBucket: R2_PUBLIC_BUCKET_NAME
		});
		
		// Check origin
		const origin = request.headers.get('origin') || request.headers.get('referer');
		const isAllowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
		
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
			try {
				// Determine which bucket to use based on the image type
				const isPublicImage = imagePath?.includes('destination/') || imagePath?.includes('guide-profile/');
				const bucketName = isPublicImage && R2_PUBLIC_BUCKET_NAME ? R2_PUBLIC_BUCKET_NAME : R2_BUCKET_NAME;
				
				if (!bucketName) {
					throw new Error('No bucket configured');
				}

				const command = new GetObjectCommand({
					Bucket: bucketName,
					Key: imagePath
				});

				console.log('[Image API] Generating presigned URL for:', {
					bucket: bucketName,
					key: imagePath,
					isPublicImage
				});

				// Generate presigned URL with 1 hour expiration
				const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
				console.log('[Image API] Generated presigned URL');
				
				// Redirect to the presigned URL
				throw redirect(302, presignedUrl);
			} catch (r2Error) {
				console.error('R2 presigned URL error:', r2Error);
				// If it's already a redirect, throw it
				if (r2Error instanceof Response && r2Error.status === 302) {
					throw r2Error;
				}
				throw error(404, 'Image not found');
			}
		}

		// For development without R2, check in-memory storage
		if (dev && imagePath) {
			console.log('[Image API] Checking dev storage for:', imagePath);
			const storedImage = devImageStorage.get(imagePath);
			if (storedImage) {
				console.log('[Image API] Found in dev storage');
				return new Response(storedImage.buffer, {
					status: 200,
					headers: {
						'Content-Type': storedImage.contentType,
						'Cache-Control': 'private, max-age=3600',
						'Access-Control-Allow-Origin': origin || 'http://localhost:5173'
					}
				});
			}
			console.log('[Image API] Not found in dev storage');
		}
		
		console.log('[Image API] Image not found, throwing 404');
		throw error(404, 'Image not found');
		
	} catch (err) {
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
	const isAllowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
	
	return new Response(null, {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': (dev || isAllowedOrigin) ? (origin || '*') : '',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Access-Control-Max-Age': '86400'
		}
	});
};
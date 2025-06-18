import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { env } from '$env/dynamic/private';
import { dev } from '$app/environment';
import { devImageStorage } from '$lib/server/devImageStorage';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
	'http://localhost:5173',
	'http://localhost:5174',
	'https://matchtrip.com', // Replace with your production domain
	'https://www.matchtrip.com'
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

		// If R2 is configured, fetch from R2
		if (r2Client && R2_BUCKET_NAME) {
			try {
				const command = new GetObjectCommand({
					Bucket: R2_BUCKET_NAME,
					Key: imagePath
				});

				const response = await r2Client.send(command);
				
				if (!response.Body) {
					throw error(404, 'Image not found');
				}

				// Convert stream to buffer
				const chunks: Uint8Array[] = [];
				const reader = response.Body.transformToWebStream().getReader();
				
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					chunks.push(value);
				}

				const buffer = Buffer.concat(chunks);

				// Set appropriate headers
				const headers: Record<string, string> = {
					'Content-Type': response.ContentType || 'image/jpeg',
					'Cache-Control': 'private, max-age=3600',
					'Access-Control-Allow-Origin': origin || '*'
				};

				if (response.ContentLength) {
					headers['Content-Length'] = response.ContentLength.toString();
				}

				return new Response(buffer, {
					status: 200,
					headers
				});
			} catch (r2Error) {
				console.error('R2 fetch error:', r2Error);
				throw error(404, 'Image not found');
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
		
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		console.error('Image serving error:', err);
		throw error(500, 'Internal server error');
	}
};
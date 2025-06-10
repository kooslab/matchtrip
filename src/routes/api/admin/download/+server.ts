import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, fileUploads } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';

// Cloudflare R2 configuration
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME;
const R2_PUBLIC_BUCKET_NAME = env.R2_PUBLIC_BUCKET_NAME;

let s3Client: S3Client | null = null;

// Initialize S3 client only if credentials are available
if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
	s3Client = new S3Client({
		region: 'auto',
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY
		}
	});
}

export const GET: RequestHandler = async ({ request, url }) => {
	// Check if user is admin
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		throw error(401, '인증되지 않았습니다');
	}

	// Fetch user role from database
	const currentUser = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: { role: true }
	});

	if (!currentUser || currentUser.role !== 'admin') {
		throw error(403, '권한이 없습니다');
	}

	// Get file ID from query parameters
	const fileId = url.searchParams.get('fileId');
	if (!fileId) {
		throw error(400, '파일 ID가 필요합니다');
	}

	// Get file info from database
	const file = await db.query.fileUploads.findFirst({
		where: eq(fileUploads.id, fileId)
	});

	if (!file) {
		throw error(404, '파일을 찾을 수 없습니다');
	}

	if (!s3Client) {
		throw error(500, 'R2 설정이 올바르지 않습니다');
	}

	if (!R2_BUCKET_NAME) {
		throw error(500, 'R2 버킷 이름이 설정되지 않았습니다');
	}

	try {
		// For private files, we need to construct the key with the upload type prefix
		const key = `${file.uploadType}/${file.filename}`;
		
		console.log('Generating presigned URL for:', {
			bucket: R2_BUCKET_NAME,
			key: key,
			originalName: file.originalName
		});

		// Create GetObject command
		const command = new GetObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			ResponseContentDisposition: `attachment; filename="${encodeURIComponent(file.originalName)}"`
		});

		// Generate presigned URL that expires in 5 minutes
		const presignedUrl = await getSignedUrl(s3Client, command, { 
			expiresIn: 300 // 5 minutes
		});

		console.log('Presigned URL generated successfully');

		// Return a redirect response instead of throwing
		return new Response(null, {
			status: 302,
			headers: {
				'Location': presignedUrl
			}
		});
	} catch (err) {
		console.error('Error generating presigned URL:', err);
		throw error(500, '파일 다운로드 URL 생성 중 오류가 발생했습니다');
	}
};
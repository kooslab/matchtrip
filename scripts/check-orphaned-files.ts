import 'dotenv/config';
import { db } from '../src/lib/server/db';
import {
	fileUploads,
	products,
	destinations,
	users,
	guideProfiles
} from '../src/lib/server/db/schema';
import { sql } from 'drizzle-orm';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_BUCKET_NAME = process.env.R2_PUBLIC_BUCKET_NAME;

// Initialize R2 client
let r2Client: S3Client | null = null;

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

async function checkOrphanedFiles() {
	console.log('🔍 Checking for orphaned files in public bucket...\n');

	// 1. Get all URLs from database
	console.log('📊 Collecting all image URLs from database...\n');

	const allUrls = new Set<string>();

	// Get URLs from file_uploads
	const files = await db.select({ url: fileUploads.url }).from(fileUploads);
	files.forEach((f) => allUrls.add(f.url));
	console.log(`  file_uploads: ${files.length} URLs`);

	// Get URLs from products.imageUrl
	const productImages = await db
		.select({ imageUrl: products.imageUrl })
		.from(products)
		.where(sql`${products.imageUrl} IS NOT NULL`);
	productImages.forEach((p) => p.imageUrl && allUrls.add(p.imageUrl));
	console.log(`  products.imageUrl: ${productImages.length} URLs`);

	// Get URLs from destinations.imageUrl
	const destImages = await db
		.select({ imageUrl: destinations.imageUrl })
		.from(destinations)
		.where(sql`${destinations.imageUrl} IS NOT NULL`);
	destImages.forEach((d) => d.imageUrl && allUrls.add(d.imageUrl));
	console.log(`  destinations.imageUrl: ${destImages.length} URLs`);

	// Get URLs from users.image
	const userImages = await db
		.select({ image: users.image })
		.from(users)
		.where(sql`${users.image} IS NOT NULL`);
	userImages.forEach((u) => u.image && allUrls.add(u.image));
	console.log(`  users.image: ${userImages.length} URLs`);

	// Get URLs from guideProfiles.profileImageUrl
	const guideImages = await db
		.select({ profileImageUrl: guideProfiles.profileImageUrl })
		.from(guideProfiles)
		.where(sql`${guideProfiles.profileImageUrl} IS NOT NULL`);
	guideImages.forEach((g) => g.profileImageUrl && allUrls.add(g.profileImageUrl));
	console.log(`  guideProfiles.profileImageUrl: ${guideImages.length} URLs`);

	console.log(`\n✅ Total unique URLs in database: ${allUrls.size}`);

	// 2. Check which URLs point to public bucket
	const publicUrls = Array.from(allUrls).filter(
		(url) => url.includes('http') || url.includes(process.env.R2_PUBLIC_URL || 'NONE')
	);

	console.log(`\n⚠️  URLs still pointing to public/HTTP: ${publicUrls.length}`);
	if (publicUrls.length > 0) {
		console.log('\nSample public URLs that need migration:');
		publicUrls.slice(0, 5).forEach((url) => console.log(`  - ${url}`));
	}

	// 3. List files in public bucket
	if (!r2Client || !R2_PUBLIC_BUCKET_NAME) {
		console.log('\n❌ Cannot check public bucket - R2 client not configured');
		return;
	}

	console.log(`\n📦 Checking files in public bucket (${R2_PUBLIC_BUCKET_NAME})...\n`);

	const publicFiles = new Set<string>();
	let continuationToken: string | undefined;

	do {
		const command = new ListObjectsV2Command({
			Bucket: R2_PUBLIC_BUCKET_NAME,
			ContinuationToken: continuationToken,
			MaxKeys: 1000
		});

		const response = await r2Client.send(command);

		if (response.Contents) {
			response.Contents.forEach((obj) => {
				if (obj.Key) publicFiles.add(obj.Key);
			});
		}

		continuationToken = response.NextContinuationToken;
	} while (continuationToken);

	console.log(`✅ Total files in public bucket: ${publicFiles.size}`);

	// 4. Check which public bucket files are referenced in database
	const referencedFiles = new Set<string>();

	allUrls.forEach((url) => {
		// Extract filename from various URL formats
		let filename = '';
		if (url.startsWith('/api/images/')) {
			filename = url.replace('/api/images/', '');
		} else if (url.includes('/')) {
			const parts = url.split('/');
			filename = parts[parts.length - 1];
		}

		// Check if this file exists in public bucket
		publicFiles.forEach((publicFile) => {
			if (publicFile.includes(filename) || filename.includes(publicFile)) {
				referencedFiles.add(publicFile);
			}
		});
	});

	console.log(`\n📊 Analysis Results:`);
	console.log(`  Files in public bucket: ${publicFiles.size}`);
	console.log(`  Files referenced in DB: ${referencedFiles.size}`);
	console.log(`  Orphaned files (not in DB): ${publicFiles.size - referencedFiles.size}`);

	// 5. Show summary
	console.log('\n' + '='.repeat(60));
	console.log('📌 CONCLUSION:');
	console.log('='.repeat(60));

	if (publicUrls.length === 0) {
		console.log('✅ All database URLs use /api/images/ format (private bucket)');
		console.log(`✅ ${publicFiles.size} files in public bucket are ORPHANED`);
		console.log('✅ These files can be safely deleted from public bucket');
	} else {
		console.log(`⚠️  ${publicUrls.length} URLs still point to public bucket`);
		console.log('⚠️  Run migration script again to update these URLs');
	}

	process.exit(0);
}

checkOrphanedFiles().catch(console.error);

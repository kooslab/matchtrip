import 'dotenv/config';
import { db } from '../src/lib/server/db';
import { fileUploads, products } from '../src/lib/server/db/schema';
import { sql, like, or, and, eq } from 'drizzle-orm';
import {
	S3Client,
	CopyObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand
} from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME; // Private bucket
const R2_PUBLIC_BUCKET_NAME = process.env.R2_PUBLIC_BUCKET_NAME; // Public bucket (if exists)
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

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
	console.log('R2 client initialized');
} else {
	console.error('R2 credentials not found in environment');
	process.exit(1);
}

async function migrateToPrivateBucket() {
	console.log('Starting migration to private bucket...\n');

	if (!R2_BUCKET_NAME) {
		console.error('R2_BUCKET_NAME not configured');
		process.exit(1);
	}

	// Find all product-related file uploads that might be in public bucket
	// These are files with type 'content' or 'product_attachment'
	const productFiles = await db
		.select()
		.from(fileUploads)
		.where(
			or(
				eq(fileUploads.uploadType, 'content'),
				eq(fileUploads.uploadType, 'product_attachment'),
				like(fileUploads.uploadType, 'product%')
			)
		);

	console.log(`Found ${productFiles.length} product-related files to check\n`);

	let migratedCount = 0;
	let skippedCount = 0;
	let errorCount = 0;

	for (const file of productFiles) {
		// Check if URL indicates it's from public bucket
		const isPublicUrl = file.url.startsWith('http') && !file.url.startsWith('/api/images/');

		if (!isPublicUrl) {
			console.log(`✓ Already private: ${file.originalName}`);
			skippedCount++;
			continue;
		}

		console.log(`\nMigrating: ${file.originalName}`);
		console.log(`  Current URL: ${file.url}`);

		try {
			// Extract the key from the public URL or filename
			let key = file.filename;
			if (file.url.includes(R2_PUBLIC_URL)) {
				key = file.url.replace(R2_PUBLIC_URL + '/', '');
			}

			// If we have a public bucket configured, copy from public to private
			if (R2_PUBLIC_BUCKET_NAME && r2Client) {
				console.log(`  Copying from public to private bucket...`);

				// Check if file exists in public bucket
				try {
					await r2Client.send(
						new HeadObjectCommand({
							Bucket: R2_PUBLIC_BUCKET_NAME,
							Key: key
						})
					);

					// Copy to private bucket
					await r2Client.send(
						new CopyObjectCommand({
							Bucket: R2_BUCKET_NAME,
							Key: key,
							CopySource: `${R2_PUBLIC_BUCKET_NAME}/${key}`
						})
					);

					console.log(`  ✓ Copied to private bucket`);

					// Optional: Delete from public bucket after successful copy
					// Uncomment if you want to remove from public bucket
					/*
					await r2Client.send(new DeleteObjectCommand({
						Bucket: R2_PUBLIC_BUCKET_NAME,
						Key: key
					}));
					console.log(`  ✓ Deleted from public bucket`);
					*/
				} catch (err: any) {
					if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
						console.log(`  ⚠ File not found in public bucket, might already be in private`);
					} else {
						throw err;
					}
				}
			}

			// Update the URL in database to use private API endpoint
			const newUrl = `/api/images/${key}`;
			await db.update(fileUploads).set({ url: newUrl }).where(eq(fileUploads.id, file.id));

			console.log(`  ✓ Updated URL to: ${newUrl}`);
			migratedCount++;
		} catch (error) {
			console.error(`  ✗ Error migrating file:`, error);
			errorCount++;
		}
	}

	// Also update any products that have imageUrl pointing to public URLs
	console.log('\nChecking product imageUrls...');
	const productsWithPublicImages = await db
		.select()
		.from(products)
		.where(and(sql`${products.imageUrl} IS NOT NULL`, sql`${products.imageUrl} LIKE 'http%'`));

	console.log(`Found ${productsWithPublicImages.length} products with public image URLs`);

	for (const product of productsWithPublicImages) {
		if (!product.imageUrl) continue;

		console.log(`\nUpdating product: ${product.title}`);
		console.log(`  Current imageUrl: ${product.imageUrl}`);

		// Extract filename from public URL
		let filename = product.imageUrl;
		if (product.imageUrl.includes(R2_PUBLIC_URL)) {
			filename = product.imageUrl.replace(R2_PUBLIC_URL + '/', '');
		} else if (product.imageUrl.includes('/')) {
			const parts = product.imageUrl.split('/');
			filename = parts[parts.length - 1];
		}

		// Update to private API endpoint
		const newUrl = `/api/images/${filename}`;
		await db.update(products).set({ imageUrl: newUrl }).where(eq(products.id, product.id));

		console.log(`  ✓ Updated to: ${newUrl}`);
	}

	console.log('\n=== Migration Summary ===');
	console.log(`✓ Migrated: ${migratedCount} files`);
	console.log(`⚠ Skipped: ${skippedCount} files (already private)`);
	console.log(`✗ Errors: ${errorCount} files`);
	console.log(`✓ Updated: ${productsWithPublicImages.length} product imageUrls`);

	process.exit(0);
}

migrateToPrivateBucket().catch(console.error);

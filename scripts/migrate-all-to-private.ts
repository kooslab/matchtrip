import 'dotenv/config';
import { db } from '../src/lib/server/db';
import {
	fileUploads,
	products,
	destinations,
	users,
	guideProfiles,
	travelerProfiles
} from '../src/lib/server/db/schema';
import { sql, like, or, and, eq, isNotNull } from 'drizzle-orm';
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
	console.log('✓ R2 client initialized');
} else {
	console.error('✗ R2 credentials not found in environment');
	process.exit(1);
}

async function extractKeyFromUrl(url: string): Promise<string | null> {
	if (!url) return null;

	// If already using /api/images/, extract the path
	if (url.startsWith('/api/images/')) {
		return url.replace('/api/images/', '');
	}

	// If it's a public URL, extract the key
	if (R2_PUBLIC_URL && url.includes(R2_PUBLIC_URL)) {
		return url.replace(R2_PUBLIC_URL + '/', '');
	}

	// If it's a full HTTP URL, get the last part
	if (url.startsWith('http')) {
		const parts = url.split('/');
		return parts[parts.length - 1];
	}

	return null;
}

async function migrateFileToPrivate(sourceBucket: string, key: string): Promise<boolean> {
	if (!r2Client || !R2_BUCKET_NAME) return false;

	try {
		// Check if file exists in source bucket
		await r2Client.send(
			new HeadObjectCommand({
				Bucket: sourceBucket,
				Key: key
			})
		);

		// Copy to private bucket if not already there
		if (sourceBucket !== R2_BUCKET_NAME) {
			await r2Client.send(
				new CopyObjectCommand({
					Bucket: R2_BUCKET_NAME,
					Key: key,
					CopySource: `${sourceBucket}/${key}`
				})
			);

			console.log(`    ✓ Copied ${key} from ${sourceBucket} to private bucket`);

			// Optional: Delete from source bucket after successful copy
			// Uncomment if you want to remove from public bucket
			/*
			await r2Client.send(new DeleteObjectCommand({
				Bucket: sourceBucket,
				Key: key
			}));
			console.log(`    ✓ Deleted from ${sourceBucket}`);
			*/
		}

		return true;
	} catch (err: any) {
		if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
			console.log(`    ⚠ File not found in ${sourceBucket}: ${key}`);
			return false;
		}
		console.error(`    ✗ Error migrating ${key}:`, err.message);
		return false;
	}
}

async function migrateAllToPrivate() {
	console.log('=== Starting Complete Migration to Private Bucket ===\n');

	if (!R2_BUCKET_NAME) {
		console.error('✗ R2_BUCKET_NAME not configured');
		process.exit(1);
	}

	const stats = {
		fileUploads: { total: 0, migrated: 0, skipped: 0, errors: 0 },
		products: { total: 0, migrated: 0, skipped: 0 },
		destinations: { total: 0, migrated: 0, skipped: 0 },
		users: { total: 0, migrated: 0, skipped: 0 },
		guideProfiles: { total: 0, migrated: 0, skipped: 0 }
	};

	// 1. Migrate all file_uploads table entries
	console.log('📁 Migrating file_uploads table...\n');
	const allFiles = await db.select().from(fileUploads);
	stats.fileUploads.total = allFiles.length;

	for (const file of allFiles) {
		// Skip if already using private API endpoint
		if (file.url.startsWith('/api/images/')) {
			stats.fileUploads.skipped++;
			continue;
		}

		console.log(`  Processing: ${file.originalName}`);
		const key = await extractKeyFromUrl(file.url);

		if (!key) {
			console.log(`    ✗ Could not extract key from URL: ${file.url}`);
			stats.fileUploads.errors++;
			continue;
		}

		// Try to migrate from public bucket if it exists
		if (R2_PUBLIC_BUCKET_NAME) {
			const migrated = await migrateFileToPrivate(R2_PUBLIC_BUCKET_NAME, key);
			if (!migrated) {
				stats.fileUploads.errors++;
				continue;
			}
		}

		// Update URL to use private API endpoint
		const newUrl = `/api/images/${key}`;
		await db.update(fileUploads).set({ url: newUrl }).where(eq(fileUploads.id, file.id));

		console.log(`    ✓ Updated URL to: ${newUrl}`);
		stats.fileUploads.migrated++;
	}

	// 2. Migrate product imageUrls
	console.log('\n📦 Migrating product images...\n');
	const productsWithImages = await db.select().from(products).where(isNotNull(products.imageUrl));
	stats.products.total = productsWithImages.length;

	for (const product of productsWithImages) {
		if (!product.imageUrl || product.imageUrl.startsWith('/api/images/')) {
			stats.products.skipped++;
			continue;
		}

		console.log(`  Product: ${product.title}`);
		const key = await extractKeyFromUrl(product.imageUrl);

		if (key) {
			const newUrl = `/api/images/${key}`;
			await db.update(products).set({ imageUrl: newUrl }).where(eq(products.id, product.id));

			console.log(`    ✓ Updated imageUrl to: ${newUrl}`);
			stats.products.migrated++;
		}
	}

	// 3. Migrate destination imageUrls
	console.log('\n🗺️  Migrating destination images...\n');
	const destinationsWithImages = await db
		.select()
		.from(destinations)
		.where(isNotNull(destinations.imageUrl));
	stats.destinations.total = destinationsWithImages.length;

	for (const destination of destinationsWithImages) {
		if (!destination.imageUrl || destination.imageUrl.startsWith('/api/images/')) {
			stats.destinations.skipped++;
			continue;
		}

		console.log(`  Destination: ${destination.city}`);
		const key = await extractKeyFromUrl(destination.imageUrl);

		if (key) {
			// Migrate file if in public bucket
			if (R2_PUBLIC_BUCKET_NAME) {
				await migrateFileToPrivate(R2_PUBLIC_BUCKET_NAME, key);
			}

			const newUrl = `/api/images/${key}`;
			await db
				.update(destinations)
				.set({ imageUrl: newUrl })
				.where(eq(destinations.id, destination.id));

			console.log(`    ✓ Updated imageUrl to: ${newUrl}`);
			stats.destinations.migrated++;
		}
	}

	// 4. Migrate user profile images
	console.log('\n👤 Migrating user profile images...\n');
	const usersWithImages = await db.select().from(users).where(isNotNull(users.image));
	stats.users.total = usersWithImages.length;

	for (const user of usersWithImages) {
		if (!user.image || user.image.startsWith('/api/images/')) {
			stats.users.skipped++;
			continue;
		}

		console.log(`  User: ${user.name || user.email}`);
		const key = await extractKeyFromUrl(user.image);

		if (key) {
			const newUrl = `/api/images/${key}`;
			await db.update(users).set({ image: newUrl }).where(eq(users.id, user.id));

			console.log(`    ✓ Updated image to: ${newUrl}`);
			stats.users.migrated++;
		}
	}

	// 5. Migrate guide profile images
	console.log('\n🎯 Migrating guide profile images...\n');
	const guideProfilesWithImages = await db
		.select()
		.from(guideProfiles)
		.where(isNotNull(guideProfiles.profileImageUrl));
	stats.guideProfiles.total = guideProfilesWithImages.length;

	for (const profile of guideProfilesWithImages) {
		if (!profile.profileImageUrl || profile.profileImageUrl.startsWith('/api/images/')) {
			stats.guideProfiles.skipped++;
			continue;
		}

		const key = await extractKeyFromUrl(profile.profileImageUrl);

		if (key) {
			const newUrl = `/api/images/${key}`;
			await db
				.update(guideProfiles)
				.set({ profileImageUrl: newUrl })
				.where(eq(guideProfiles.userId, profile.userId));

			console.log(`    ✓ Updated profileImageUrl to: ${newUrl}`);
			stats.guideProfiles.migrated++;
		}
	}

	// Note: Traveler profiles don't have a separate profile image field
	// Their profile images are stored in the users table

	// Print summary
	console.log('\n' + '='.repeat(60));
	console.log('📊 MIGRATION SUMMARY');
	console.log('='.repeat(60));

	console.log('\n📁 File Uploads:');
	console.log(`   Total: ${stats.fileUploads.total}`);
	console.log(`   ✓ Migrated: ${stats.fileUploads.migrated}`);
	console.log(`   ⚠ Skipped: ${stats.fileUploads.skipped}`);
	console.log(`   ✗ Errors: ${stats.fileUploads.errors}`);

	console.log('\n📦 Products:');
	console.log(`   Total: ${stats.products.total}`);
	console.log(`   ✓ Migrated: ${stats.products.migrated}`);
	console.log(`   ⚠ Skipped: ${stats.products.skipped}`);

	console.log('\n🗺️  Destinations:');
	console.log(`   Total: ${stats.destinations.total}`);
	console.log(`   ✓ Migrated: ${stats.destinations.migrated}`);
	console.log(`   ⚠ Skipped: ${stats.destinations.skipped}`);

	console.log('\n👤 Users:');
	console.log(`   Total: ${stats.users.total}`);
	console.log(`   ✓ Migrated: ${stats.users.migrated}`);
	console.log(`   ⚠ Skipped: ${stats.users.skipped}`);

	console.log('\n🎯 Guide Profiles:');
	console.log(`   Total: ${stats.guideProfiles.total}`);
	console.log(`   ✓ Migrated: ${stats.guideProfiles.migrated}`);
	console.log(`   ⚠ Skipped: ${stats.guideProfiles.skipped}`);

	const totalMigrated =
		stats.fileUploads.migrated +
		stats.products.migrated +
		stats.destinations.migrated +
		stats.users.migrated +
		stats.guideProfiles.migrated;

	console.log('\n' + '='.repeat(60));
	console.log(`✅ TOTAL MIGRATED: ${totalMigrated} items`);
	console.log('='.repeat(60));

	console.log('\n📌 IMPORTANT: After migration, all images will be served through:');
	console.log('   /api/images/[path] endpoint (requires authentication)');
	console.log('\n✓ Migration completed successfully!');

	process.exit(0);
}

migrateAllToPrivate().catch(console.error);

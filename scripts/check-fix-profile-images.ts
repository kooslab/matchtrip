#!/usr/bin/env bun

import { db } from '../src/lib/server/db';
import { guideProfiles, travelerProfiles, users } from '../src/lib/server/db/schema';
import { eq, isNotNull, or, and, not, like } from 'drizzle-orm';
import {
	S3Client,
	HeadObjectCommand,
	CopyObjectCommand,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';

// Load environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Initialize R2 client
const r2Client = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID!,
		secretAccessKey: R2_SECRET_ACCESS_KEY!
	},
	forcePathStyle: true
});

async function checkObjectExists(key: string): Promise<boolean> {
	try {
		await r2Client.send(
			new HeadObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: key
			})
		);
		return true;
	} catch (error) {
		return false;
	}
}

async function moveObject(oldKey: string, newKey: string): Promise<boolean> {
	try {
		// Copy to new location
		await r2Client.send(
			new CopyObjectCommand({
				Bucket: R2_BUCKET_NAME,
				CopySource: `${R2_BUCKET_NAME}/${oldKey}`,
				Key: newKey
			})
		);

		// Delete from old location
		await r2Client.send(
			new DeleteObjectCommand({
				Bucket: R2_BUCKET_NAME,
				Key: oldKey
			})
		);

		console.log(`✅ Moved: ${oldKey} → ${newKey}`);
		return true;
	} catch (error) {
		console.error(`❌ Failed to move ${oldKey}:`, error);
		return false;
	}
}

async function analyzeAndFixProfileImages() {
	console.log('🔍 Analyzing profile images...\n');

	// Stats
	const stats = {
		guideProfiles: { total: 0, needsFix: 0, fixed: 0, notFound: 0 },
		travelerProfiles: { total: 0, needsFix: 0, fixed: 0, notFound: 0 },
		userProfiles: { total: 0, needsFix: 0, fixed: 0, notFound: 0 }
	};

	// 1. Check Guide Profiles
	console.log('📸 Checking Guide Profiles...');
	const guides = await db
		.select()
		.from(guideProfiles)
		.where(isNotNull(guideProfiles.profileImageUrl));

	for (const guide of guides) {
		stats.guideProfiles.total++;
		const imageUrl = guide.profileImageUrl!;

		// Skip if it's a full URL (Google OAuth or already has /api/images/)
		if (imageUrl.startsWith('http') || imageUrl.startsWith('/api/images/')) {
			console.log(`⏭️  Skipping external/full URL: ${imageUrl}`);
			continue;
		}

		// Check different possible locations
		const possiblePaths = [
			imageUrl, // As stored
			`guide-profile/${imageUrl}`, // With folder prefix
			imageUrl.replace('/api/images/', ''), // Remove API prefix if present
			imageUrl.replace('guide-profile/', '') // Without folder prefix
		];

		let foundPath: string | null = null;
		for (const path of possiblePaths) {
			if (await checkObjectExists(path)) {
				foundPath = path;
				break;
			}
		}

		if (!foundPath) {
			console.log(`❌ NOT FOUND: ${imageUrl} (Guide: ${guide.userId})`);
			stats.guideProfiles.notFound++;
			continue;
		}

		// Check if it needs to be fixed
		const correctPath = `guide-profile/${imageUrl.split('/').pop()}`;
		if (foundPath !== correctPath) {
			console.log(`🔧 Needs fix: ${foundPath} → ${correctPath}`);
			stats.guideProfiles.needsFix++;

			// Move file if needed
			if (foundPath !== correctPath && (await checkObjectExists(foundPath))) {
				if (await moveObject(foundPath, correctPath)) {
					stats.guideProfiles.fixed++;
				}
			}

			// Update database to store just the filename
			const filename = imageUrl.split('/').pop()!;
			await db
				.update(guideProfiles)
				.set({ profileImageUrl: filename })
				.where(eq(guideProfiles.userId, guide.userId));
			console.log(`✅ Updated DB for guide ${guide.userId}: ${filename}`);
		} else {
			console.log(`✅ OK: ${imageUrl}`);
		}
	}

	// 2. Check Traveler Profiles
	console.log('\n📸 Checking Traveler Profiles...');
	const travelers = await db
		.select()
		.from(travelerProfiles)
		.where(isNotNull(travelerProfiles.profileImageUrl));

	for (const traveler of travelers) {
		stats.travelerProfiles.total++;
		const imageUrl = traveler.profileImageUrl!;

		// Skip if it's a full URL
		if (imageUrl.startsWith('http') || imageUrl.startsWith('/api/images/')) {
			console.log(`⏭️  Skipping external/full URL: ${imageUrl}`);
			continue;
		}

		// Check different possible locations
		const possiblePaths = [
			imageUrl,
			`traveler-profile/${imageUrl}`,
			imageUrl.replace('/api/images/', ''),
			imageUrl.replace('traveler-profile/', '')
		];

		let foundPath: string | null = null;
		for (const path of possiblePaths) {
			if (await checkObjectExists(path)) {
				foundPath = path;
				break;
			}
		}

		if (!foundPath) {
			console.log(`❌ NOT FOUND: ${imageUrl} (Traveler: ${traveler.userId})`);
			stats.travelerProfiles.notFound++;
			continue;
		}

		// Check if it needs to be fixed
		const correctPath = `traveler-profile/${imageUrl.split('/').pop()}`;
		if (foundPath !== correctPath) {
			console.log(`🔧 Needs fix: ${foundPath} → ${correctPath}`);
			stats.travelerProfiles.needsFix++;

			// Move file if needed
			if (foundPath !== correctPath && (await checkObjectExists(foundPath))) {
				if (await moveObject(foundPath, correctPath)) {
					stats.travelerProfiles.fixed++;
				}
			}

			// Update database to store just the filename
			const filename = imageUrl.split('/').pop()!;
			await db
				.update(travelerProfiles)
				.set({ profileImageUrl: filename })
				.where(eq(travelerProfiles.userId, traveler.userId));
			console.log(`✅ Updated DB for traveler ${traveler.userId}: ${filename}`);
		} else {
			console.log(`✅ OK: ${imageUrl}`);
		}
	}

	// 3. Check User Profile Images (legacy)
	console.log('\n📸 Checking User Profile Images (legacy)...');
	const usersWithImages = await db.select().from(users).where(isNotNull(users.image));

	for (const user of usersWithImages) {
		stats.userProfiles.total++;
		const imageUrl = user.image!;

		// Skip if it's a Google OAuth URL
		if (imageUrl.startsWith('http')) {
			console.log(`⏭️  Skipping Google OAuth URL: ${imageUrl}`);
			continue;
		}

		console.log(`👤 User ${user.id} has legacy image: ${imageUrl}`);
		// Legacy user images might need migration to profile tables
	}

	// Print summary
	console.log('\n' + '='.repeat(50));
	console.log('📊 SUMMARY');
	console.log('='.repeat(50));

	console.log('\nGuide Profiles:');
	console.log(`  Total: ${stats.guideProfiles.total}`);
	console.log(`  Needs Fix: ${stats.guideProfiles.needsFix}`);
	console.log(`  Fixed: ${stats.guideProfiles.fixed}`);
	console.log(`  Not Found: ${stats.guideProfiles.notFound}`);

	console.log('\nTraveler Profiles:');
	console.log(`  Total: ${stats.travelerProfiles.total}`);
	console.log(`  Needs Fix: ${stats.travelerProfiles.needsFix}`);
	console.log(`  Fixed: ${stats.travelerProfiles.fixed}`);
	console.log(`  Not Found: ${stats.travelerProfiles.notFound}`);

	console.log('\nUser Profiles (legacy):');
	console.log(`  Total: ${stats.userProfiles.total}`);

	console.log('\n✅ Analysis complete!');

	// Provide recommendations
	console.log('\n' + '='.repeat(50));
	console.log('💡 RECOMMENDATIONS');
	console.log('='.repeat(50));

	if (stats.guideProfiles.notFound > 0 || stats.travelerProfiles.notFound > 0) {
		console.log('\n⚠️  Some images were not found in storage.');
		console.log('   These profiles may have broken image links.');
	}

	if (stats.guideProfiles.needsFix > 0 || stats.travelerProfiles.needsFix > 0) {
		console.log('\n🔧 Some images needed fixing.');
		console.log('   Database has been updated to store consistent paths.');
	}

	console.log('\n📝 Database Storage Pattern:');
	console.log('   - Guide profiles: Store just filename (e.g., "1234-abc.png")');
	console.log('   - Traveler profiles: Store just filename (e.g., "5678-xyz.png")');
	console.log('   - API will automatically add folder prefix when serving');

	process.exit(0);
}

// Run the script
analyzeAndFixProfileImages().catch((error) => {
	console.error('Script failed:', error);
	process.exit(1);
});

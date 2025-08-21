#!/usr/bin/env bun

import { db } from '../src/lib/server/db';
import { guideProfiles, travelerProfiles, users } from '../src/lib/server/db/schema';
import { isNotNull } from 'drizzle-orm';
import { S3Client, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Load environment variables
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Initialize R2 client if credentials are available
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

async function checkObjectExists(key: string): Promise<boolean> {
	if (!r2Client) return false;
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

async function listObjectsInFolder(prefix: string): Promise<string[]> {
	if (!r2Client) return [];
	try {
		const response = await r2Client.send(
			new ListObjectsV2Command({
				Bucket: R2_BUCKET_NAME,
				Prefix: prefix,
				MaxKeys: 1000
			})
		);
		return response.Contents?.map((obj) => obj.Key!) || [];
	} catch (error) {
		console.error(`Failed to list objects with prefix ${prefix}:`, error);
		return [];
	}
}

async function analyzeProfileImages() {
	console.log('🔍 Analyzing Profile Images Storage\n');
	console.log('='.repeat(60));

	// First, list what's actually in R2 storage
	if (r2Client) {
		console.log('📦 R2 STORAGE CONTENTS:\n');

		const guideFolderFiles = await listObjectsInFolder('guide-profile/');
		console.log(`📁 guide-profile/ (${guideFolderFiles.length} files)`);
		if (guideFolderFiles.length > 0) {
			guideFolderFiles.slice(0, 5).forEach((file) => {
				console.log(`   - ${file}`);
			});
			if (guideFolderFiles.length > 5) {
				console.log(`   ... and ${guideFolderFiles.length - 5} more`);
			}
		}

		const travelerFolderFiles = await listObjectsInFolder('traveler-profile/');
		console.log(`\n📁 traveler-profile/ (${travelerFolderFiles.length} files)`);
		if (travelerFolderFiles.length > 0) {
			travelerFolderFiles.slice(0, 5).forEach((file) => {
				console.log(`   - ${file}`);
			});
			if (travelerFolderFiles.length > 5) {
				console.log(`   ... and ${travelerFolderFiles.length - 5} more`);
			}
		}

		// Check for files without folder prefix (legacy)
		const allFiles = await listObjectsInFolder('');
		const legacyFiles = allFiles.filter(
			(f) => !f.includes('/') && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
		);
		if (legacyFiles.length > 0) {
			console.log(`\n⚠️  ROOT LEVEL FILES (need migration): ${legacyFiles.length} files`);
			legacyFiles.slice(0, 10).forEach((file) => {
				console.log(`   - ${file}`);
			});
			if (legacyFiles.length > 10) {
				console.log(`   ... and ${legacyFiles.length - 10} more`);
			}
		}
	}

	console.log('\n' + '='.repeat(60));
	console.log('💾 DATABASE PROFILE IMAGES:\n');

	// Check Guide Profiles
	console.log('👨‍💼 GUIDE PROFILES:');
	const guides = await db
		.select()
		.from(guideProfiles)
		.where(isNotNull(guideProfiles.profileImageUrl));

	const guideStats = {
		total: 0,
		googleOAuth: 0,
		withFolder: 0,
		withoutFolder: 0,
		withApiPrefix: 0,
		foundInStorage: 0,
		notFoundInStorage: 0
	};

	for (const guide of guides) {
		guideStats.total++;
		const imageUrl = guide.profileImageUrl!;

		if (imageUrl.startsWith('http')) {
			guideStats.googleOAuth++;
		} else if (imageUrl.startsWith('/api/images/')) {
			guideStats.withApiPrefix++;
		} else if (imageUrl.includes('/')) {
			guideStats.withFolder++;
		} else {
			guideStats.withoutFolder++;
		}

		// Check if file exists in storage
		if (r2Client && !imageUrl.startsWith('http')) {
			const pathsToCheck = [
				imageUrl,
				`guide-profile/${imageUrl}`,
				imageUrl.replace('/api/images/', ''),
				`guide-profile/${imageUrl.split('/').pop()}`
			];

			let found = false;
			for (const path of pathsToCheck) {
				if (await checkObjectExists(path)) {
					found = true;
					break;
				}
			}

			if (found) {
				guideStats.foundInStorage++;
			} else {
				guideStats.notFoundInStorage++;
				console.log(`   ❌ Not found: ${imageUrl} (User: ${guide.userId})`);
			}
		}
	}

	console.log(`  Total: ${guideStats.total}`);
	console.log(`  - Google OAuth URLs: ${guideStats.googleOAuth}`);
	console.log(`  - With /api/images/ prefix: ${guideStats.withApiPrefix}`);
	console.log(`  - With folder path: ${guideStats.withFolder}`);
	console.log(`  - Without folder (just filename): ${guideStats.withoutFolder}`);
	if (r2Client) {
		console.log(`  - Found in storage: ${guideStats.foundInStorage}`);
		console.log(`  - NOT found in storage: ${guideStats.notFoundInStorage}`);
	}

	// Check Traveler Profiles
	console.log('\n👤 TRAVELER PROFILES:');
	const travelers = await db
		.select()
		.from(travelerProfiles)
		.where(isNotNull(travelerProfiles.profileImageUrl));

	const travelerStats = {
		total: 0,
		googleOAuth: 0,
		withFolder: 0,
		withoutFolder: 0,
		withApiPrefix: 0,
		foundInStorage: 0,
		notFoundInStorage: 0
	};

	for (const traveler of travelers) {
		travelerStats.total++;
		const imageUrl = traveler.profileImageUrl!;

		if (imageUrl.startsWith('http')) {
			travelerStats.googleOAuth++;
		} else if (imageUrl.startsWith('/api/images/')) {
			travelerStats.withApiPrefix++;
		} else if (imageUrl.includes('/')) {
			travelerStats.withFolder++;
		} else {
			travelerStats.withoutFolder++;
		}

		// Check if file exists in storage
		if (r2Client && !imageUrl.startsWith('http')) {
			const pathsToCheck = [
				imageUrl,
				`traveler-profile/${imageUrl}`,
				imageUrl.replace('/api/images/', ''),
				`traveler-profile/${imageUrl.split('/').pop()}`
			];

			let found = false;
			for (const path of pathsToCheck) {
				if (await checkObjectExists(path)) {
					found = true;
					break;
				}
			}

			if (found) {
				travelerStats.foundInStorage++;
			} else {
				travelerStats.notFoundInStorage++;
				console.log(`   ❌ Not found: ${imageUrl} (User: ${traveler.userId})`);
			}
		}
	}

	console.log(`  Total: ${travelerStats.total}`);
	console.log(`  - Google OAuth URLs: ${travelerStats.googleOAuth}`);
	console.log(`  - With /api/images/ prefix: ${travelerStats.withApiPrefix}`);
	console.log(`  - With folder path: ${travelerStats.withFolder}`);
	console.log(`  - Without folder (just filename): ${travelerStats.withoutFolder}`);
	if (r2Client) {
		console.log(`  - Found in storage: ${travelerStats.foundInStorage}`);
		console.log(`  - NOT found in storage: ${travelerStats.notFoundInStorage}`);
	}

	// Check Users table (legacy)
	console.log('\n🔄 USERS TABLE (legacy image field):');
	const usersWithImages = await db.select().from(users).where(isNotNull(users.image));
	const userImageTypes = {
		total: 0,
		googleOAuth: 0,
		other: 0
	};

	for (const user of usersWithImages) {
		userImageTypes.total++;
		if (user.image!.startsWith('http')) {
			userImageTypes.googleOAuth++;
		} else {
			userImageTypes.other++;
			console.log(`   - ${user.id}: ${user.image}`);
		}
	}

	console.log(`  Total: ${userImageTypes.total}`);
	console.log(`  - Google OAuth: ${userImageTypes.googleOAuth}`);
	console.log(`  - Other: ${userImageTypes.other}`);

	// Summary and recommendations
	console.log('\n' + '='.repeat(60));
	console.log('📊 ANALYSIS RESULTS:\n');

	const totalProblems = guideStats.notFoundInStorage + travelerStats.notFoundInStorage;
	if (totalProblems > 0) {
		console.log(`⚠️  Found ${totalProblems} profile images that don't exist in storage!`);
		console.log('   These need to be fixed or re-uploaded.');
	}

	const needsMigration = guideStats.withoutFolder + travelerStats.withoutFolder;
	if (needsMigration > 0) {
		console.log(`\n🔧 ${needsMigration} profile images are stored without folder prefix.`);
		console.log('   These should be migrated to have proper folder structure.');
	}

	console.log('\n💡 RECOMMENDED STORAGE PATTERN:');
	console.log('   Database: Store just the filename (e.g., "1234-abc.png")');
	console.log('   Storage: Files should be in "guide-profile/" or "traveler-profile/" folders');
	console.log('   API: Will automatically add folder prefix when serving');

	console.log('\n✅ To fix issues, run: bun run scripts/check-fix-profile-images.ts');

	process.exit(0);
}

// Run the script
analyzeProfileImages().catch((error) => {
	console.error('Script failed:', error);
	process.exit(1);
});

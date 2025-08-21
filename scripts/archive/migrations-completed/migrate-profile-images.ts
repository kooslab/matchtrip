#!/usr/bin/env bun

import { db } from '../src/lib/server/db';
import { guideProfiles, travelerProfiles, users } from '../src/lib/server/db/schema';
import { eq, isNotNull, like, and, not } from 'drizzle-orm';

async function migrateProfileImages() {
	console.log('🔄 Starting Profile Image Migration\n');
	console.log('='.repeat(60));

	let updatedCount = 0;

	// 1. Fix Guide Profiles
	console.log('👨‍💼 Migrating Guide Profiles...\n');
	const guides = await db
		.select()
		.from(guideProfiles)
		.where(isNotNull(guideProfiles.profileImageUrl));

	for (const guide of guides) {
		const imageUrl = guide.profileImageUrl!;
		let newUrl = imageUrl;

		// Skip Google OAuth URLs
		if (imageUrl.startsWith('http')) {
			console.log(`⏭️  Skipping OAuth URL: ${imageUrl}`);
			continue;
		}

		// Remove /api/images/ prefix if present
		if (imageUrl.startsWith('/api/images/')) {
			newUrl = imageUrl.replace('/api/images/', '');
		}

		// Remove folder prefix if present (we only want filename)
		if (newUrl.includes('/')) {
			newUrl = newUrl.split('/').pop()!;
		}

		// Update if changed
		if (newUrl !== imageUrl) {
			console.log(`📝 Updating guide ${guide.userId}:`);
			console.log(`   From: ${imageUrl}`);
			console.log(`   To:   ${newUrl}`);

			await db
				.update(guideProfiles)
				.set({ profileImageUrl: newUrl })
				.where(eq(guideProfiles.userId, guide.userId));

			updatedCount++;
		}
	}

	// 2. Fix Traveler Profiles
	console.log('\n👤 Migrating Traveler Profiles...\n');
	const travelers = await db
		.select()
		.from(travelerProfiles)
		.where(isNotNull(travelerProfiles.profileImageUrl));

	for (const traveler of travelers) {
		const imageUrl = traveler.profileImageUrl!;
		let newUrl = imageUrl;

		// Skip Google OAuth URLs
		if (imageUrl.startsWith('http')) {
			console.log(`⏭️  Skipping OAuth URL: ${imageUrl}`);
			continue;
		}

		// Remove /api/images/ prefix if present
		if (imageUrl.startsWith('/api/images/')) {
			newUrl = imageUrl.replace('/api/images/', '');
		}

		// Remove folder prefix if present (we only want filename)
		if (newUrl.includes('/')) {
			newUrl = newUrl.split('/').pop()!;
		}

		// Update if changed
		if (newUrl !== imageUrl) {
			console.log(`📝 Updating traveler ${traveler.userId}:`);
			console.log(`   From: ${imageUrl}`);
			console.log(`   To:   ${newUrl}`);

			await db
				.update(travelerProfiles)
				.set({ profileImageUrl: newUrl })
				.where(eq(travelerProfiles.userId, traveler.userId));

			updatedCount++;
		}
	}

	// 3. Clean up Users table (remove /api/images/ prefix)
	console.log('\n🔄 Cleaning Users Table...\n');
	const usersWithApiPrefix = await db
		.select()
		.from(users)
		.where(and(isNotNull(users.image), like(users.image, '/api/images/%')));

	for (const user of usersWithApiPrefix) {
		const imageUrl = user.image!;
		let newUrl = imageUrl.replace('/api/images/', '');

		// For Google OAuth images, we keep them as-is (without prefix)
		// For uploaded images, they should have been migrated to profile tables

		console.log(`📝 Updating user ${user.id}:`);
		console.log(`   From: ${imageUrl}`);
		console.log(`   To:   ${newUrl}`);

		await db.update(users).set({ image: newUrl }).where(eq(users.id, user.id));

		updatedCount++;
	}

	// Summary
	console.log('\n' + '='.repeat(60));
	console.log('✅ MIGRATION COMPLETE\n');
	console.log(`📊 Updated ${updatedCount} profile image URLs\n`);

	console.log('📝 New Storage Pattern:');
	console.log('   - Guide/Traveler profiles: Store just filename');
	console.log('   - Users table: Store OAuth ID or filename (no /api/images/ prefix)');
	console.log('   - API endpoint handles adding folder prefixes automatically');

	console.log('\n💡 Next Steps:');
	console.log('   1. Test profile image display in the app');
	console.log('   2. For missing images, users will need to re-upload');
	console.log('   3. Run check-profile-images.ts to verify migration');

	process.exit(0);
}

// Run the migration
migrateProfileImages().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});

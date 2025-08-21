#!/usr/bin/env bun
/**
 * Migrate destination images back to public bucket URLs
 * This script reverses the previous migration that moved all images to private bucket
 * Only destination images should be moved back to public for performance and reliability
 */

import { db } from '../src/lib/server/db/index.js';
import { destinations } from '../src/lib/server/db/schema.js';
import { like, and, isNotNull } from 'drizzle-orm';

// Environment variables
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;

if (!R2_PUBLIC_URL && !R2_ACCOUNT_ID) {
	console.error('❌ Error: Neither R2_PUBLIC_URL nor R2_ACCOUNT_ID is set');
	process.exit(1);
}

async function migrateDestinationsToPublic() {
	console.log('🗺️  Migrating destination images to public bucket URLs...\n');

	try {
		// Find all destinations with /api/images/destination/ URLs
		const destinationsToMigrate = await db
			.select()
			.from(destinations)
			.where(
				and(
					isNotNull(destinations.imageUrl),
					like(destinations.imageUrl, '/api/images/destination/%')
				)
			);

		console.log(`Found ${destinationsToMigrate.length} destinations to migrate\n`);

		if (destinationsToMigrate.length === 0) {
			console.log('✅ No destinations need migration');
			return;
		}

		let migrated = 0;
		let skipped = 0;

		for (const destination of destinationsToMigrate) {
			if (!destination.imageUrl) continue;

			// Extract the filename from /api/images/destination/filename.ext
			const match = destination.imageUrl.match(/^\/api\/images\/destination\/(.+)$/);
			if (!match) {
				console.log(
					`⚠️  Skipping ${destination.city}: Invalid URL format: ${destination.imageUrl}`
				);
				skipped++;
				continue;
			}

			const filename = match[1];

			// Construct public URL
			let publicUrl: string;
			if (R2_PUBLIC_URL) {
				publicUrl = `${R2_PUBLIC_URL}/destination/${filename}`;
			} else if (R2_ACCOUNT_ID) {
				publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/destination/${filename}`;
			} else {
				console.log(`⚠️  Skipping ${destination.city}: No public URL configuration available`);
				skipped++;
				continue;
			}

			// Update the database
			await db
				.update(destinations)
				.set({ imageUrl: publicUrl })
				.where({ id: destination.id } as any);

			console.log(`✅ ${destination.city}: ${destination.imageUrl} → ${publicUrl}`);
			migrated++;
		}

		console.log(`\n🎉 Migration completed!`);
		console.log(`   ✅ Migrated: ${migrated} destinations`);
		console.log(`   ⚠️  Skipped: ${skipped} destinations`);

		if (migrated > 0) {
			console.log('\n📝 Next steps:');
			console.log('   1. Verify images load correctly on the frontend');
			console.log('   2. Check that public R2 bucket contains the destination images');
			console.log('   3. Monitor for any 404 errors on destination images');
		}
	} catch (error) {
		console.error('❌ Migration failed:', error);
		process.exit(1);
	}
}

// Run the migration
await migrateDestinationsToPublic();

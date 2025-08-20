#!/usr/bin/env bun
/**
 * Script to fix migration history by marking all existing migrations as applied
 * This is needed when the database already has the schema but migrations table is out of sync
 * 
 * Usage:
 *   bun run scripts/fix-migration-history.ts        # For dev database (.env)
 *   bun run scripts/fix-migration-history.ts prod   # For prod database (.env.prod)
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import { readdir } from 'fs/promises';
import { join } from 'path';

// Check if running for prod
const isProd = process.argv[2] === 'prod';

// Load appropriate environment variables
if (isProd) {
	config({ path: '.env.prod' });
	console.log('📌 Using .env.prod configuration\n');
} else {
	config();
	console.log('📌 Using .env configuration\n');
}

if (!process.env.DATABASE_URL) {
	console.error(`❌ DATABASE_URL not found in ${isProd ? '.env.prod' : '.env'}`);
	process.exit(1);
}

async function fixMigrationHistory() {
	console.log('🔧 Fixing migration history...\n');
	console.log(`📦 Database: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
	
	// Connect to database
	const sql = postgres(process.env.DATABASE_URL, {
		ssl: 'require',
		max: 1
	});

	try {
		// Get list of all migration files
		const migrationsDir = join(process.cwd(), 'drizzle');
		const files = await readdir(migrationsDir);
		const migrationFiles = files
			.filter(f => f.endsWith('.sql'))
			.sort();
		
		console.log(`\n📁 Found ${migrationFiles.length} migration files\n`);

		// Check current migration history
		const existingMigrations = await sql`
			SELECT hash, created_at 
			FROM drizzle.__drizzle_migrations 
			ORDER BY created_at
		`;

		console.log(`📊 Current migration history has ${existingMigrations.length} entries\n`);

		if (existingMigrations.length > 0) {
			console.log('Existing migrations:');
			existingMigrations.forEach(m => {
				// created_at is stored as bigint (milliseconds)
				const date = m.created_at ? new Date(parseInt(m.created_at)) : null;
				console.log(`  - ${m.hash} (${date ? date.toLocaleString() : 'No date'})`);
			});
			console.log('');
		}

		// Get hashes for all migration files (excluding the latest one we want to apply)
		const migrationsToMark = migrationFiles.slice(0, -1); // All except the last one (0026)
		
		console.log(`🎯 Will mark ${migrationsToMark.length} migrations as applied (excluding the latest)\n`);

		// Create migration entries for missing ones
		let addedCount = 0;
		for (const fileName of migrationsToMark) {
			// Generate a hash from filename (Drizzle uses file content hash, but for marking as applied, we can use filename)
			const hash = fileName.replace('.sql', '');
			
			// Check if this migration is already recorded
			const exists = existingMigrations.some(m => m.hash === hash || m.hash.includes(fileName.split('_')[0]));
			
			if (!exists) {
				console.log(`  ➕ Adding migration: ${fileName}`);
				
				try {
					// Insert migration record (created_at is bigint in milliseconds)
					await sql`
						INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
						VALUES (${hash}, ${Date.now()})
					`;
					addedCount++;
				} catch (insertError: any) {
					if (insertError.code === '23505') { // Unique violation
						console.log(`  ⚠️  Already exists (duplicate): ${fileName}`);
					} else {
						throw insertError;
					}
				}
			} else {
				console.log(`  ✓ Already recorded: ${fileName}`);
			}
		}

		console.log(`\n✅ Added ${addedCount} migration entries`);
		console.log('\n📝 Latest migration (0026_common_firelord.sql) was NOT marked as applied');
		console.log('   Run "bun run db:migrate" to apply it\n');

	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

// Run the script
fixMigrationHistory().catch(error => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
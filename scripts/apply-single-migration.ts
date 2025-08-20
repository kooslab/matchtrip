#!/usr/bin/env bun
/**
 * Apply a single migration directly to the database
 * This bypasses Drizzle's migration system when it's out of sync
 * 
 * Usage:
 *   bun run scripts/apply-single-migration.ts prod 0027_drop_email_hash
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Get arguments
const target = process.argv[2]; // 'dev' or 'prod'
const migrationName = process.argv[3]; // e.g., '0027_drop_email_hash'

if (!target || !migrationName) {
	console.error('Usage: bun run scripts/apply-single-migration.ts [dev|prod] [migration_name]');
	console.error('Example: bun run scripts/apply-single-migration.ts prod 0027_drop_email_hash');
	process.exit(1);
}

// Load appropriate environment
if (target === 'prod') {
	config({ path: '.env.prod' });
	console.log('📌 Using .env.prod configuration\n');
} else {
	config();
	console.log('📌 Using .env configuration\n');
}

if (!process.env.DATABASE_URL) {
	console.error(`❌ DATABASE_URL not found in ${target === 'prod' ? '.env.prod' : '.env'}`);
	process.exit(1);
}

async function applySingleMigration() {
	console.log(`🔧 Applying migration: ${migrationName}\n`);
	console.log(`📦 Database: ${process.env.DATABASE_URL?.substring(0, 50)}...\n`);
	
	// Connect to database
	const sql = postgres(process.env.DATABASE_URL, {
		ssl: 'require',
		max: 1
	});

	try {
		// Read migration file
		const migrationPath = join(process.cwd(), 'drizzle', `${migrationName}.sql`);
		const migrationSQL = await readFile(migrationPath, 'utf-8');
		
		console.log('📄 Migration SQL:');
		console.log('─'.repeat(50));
		console.log(migrationSQL);
		console.log('─'.repeat(50));
		console.log('');
		
		// Split by statement breakpoint and execute each statement
		const statements = migrationSQL.split('--> statement-breakpoint').filter(s => s.trim());
		
		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i].trim();
			if (statement) {
				console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
				console.log(`   ${statement.substring(0, 60)}${statement.length > 60 ? '...' : ''}`);
				
				try {
					await sql.unsafe(statement);
					console.log(`   ✅ Success`);
				} catch (error: any) {
					// Check if it's an expected error (like index doesn't exist)
					if (error.code === '42704' && statement.includes('DROP INDEX')) {
						console.log(`   ⚠️  Index doesn't exist (already dropped)`);
					} else if (error.code === '42703' && statement.includes('DROP COLUMN')) {
						console.log(`   ⚠️  Column doesn't exist (already dropped)`);
					} else {
						throw error;
					}
				}
			}
		}
		
		console.log('\n📝 Recording migration in __drizzle_migrations table...');
		
		// Record the migration
		await sql`
			INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
			VALUES (${migrationName}, ${Date.now()})
		`;
		
		console.log('✅ Migration recorded successfully');
		
		console.log('\n🎉 Migration applied successfully!');
		
	} catch (error) {
		console.error('\n❌ Error applying migration:', error);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

// Run it
applySingleMigration().catch(error => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
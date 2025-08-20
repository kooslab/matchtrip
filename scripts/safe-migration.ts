#!/usr/bin/env bun
/**
 * Safe Database Migration Script - Fixed Version
 * Handles the migration from main to dev branch with display IDs
 * 
 * Usage:
 * - For dev: bun run scripts/safe-migration-fixed.ts
 * - For prod: bun --env-file=.env.prod run scripts/safe-migration-fixed.ts
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '../src/lib/server/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

// Colors for terminal output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message: string) {
	console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function success(message: string) {
	console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function info(message: string) {
	console.log(`${colors.cyan}ℹ️  ${message}${colors.reset}`);
}

function warning(message: string) {
	console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

async function createBackup() {
	const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
	const backupDir = path.join(process.cwd(), 'backups');
	
	// Create backups directory if it doesn't exist
	if (!fs.existsSync(backupDir)) {
		fs.mkdirSync(backupDir, { recursive: true });
	}
	
	const backupFile = path.join(backupDir, `backup_${timestamp}.sql`);
	const databaseUrl = process.env.DATABASE_URL;
	
	if (!databaseUrl) {
		throw new Error('DATABASE_URL not found in environment variables');
	}
	
	info('Creating database backup...');
	
	try {
		await execAsync(`pg_dump "${databaseUrl}" > "${backupFile}"`);
		success(`Backup created: ${backupFile}`);
		return backupFile;
	} catch (err) {
		error(`Failed to create backup: ${err}`);
		throw err;
	}
}

async function checkMigrationStatus() {
	info('Checking current migration status...');
	
	try {
		// Check if display_id columns exist - Fixed query
		const checkColumnsQuery = `
			SELECT 
				table_name,
				column_name
			FROM information_schema.columns
			WHERE table_schema = 'public'
			AND column_name = 'display_id'
			AND table_name IN ('products', 'product_offers', 'offers', 'payments')
		`;
		
		const checkColumns = await db.execute(sql.raw(checkColumnsQuery));
		
		// Check if product_sequences table exists - Fixed query
		const checkSequenceTableQuery = `
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = 'product_sequences'
			) as exists
		`;
		
		const checkSequenceTable = await db.execute(sql.raw(checkSequenceTableQuery));
		
		// Safely check results
		const hasDisplayColumns = checkColumns && Array.isArray(checkColumns) && checkColumns.length > 0;
		const hasSequenceTable = checkSequenceTable && checkSequenceTable[0]?.exists === true;
		
		return {
			hasDisplayColumns,
			hasSequenceTable,
			existingColumns: hasDisplayColumns ? checkColumns : []
		};
	} catch (err) {
		error(`Failed to check migration status: ${err}`);
		// Return safe defaults if check fails
		return {
			hasDisplayColumns: false,
			hasSequenceTable: false,
			existingColumns: []
		};
	}
}

async function applyMigrations() {
	info('Applying database migrations...');
	
	try {
		// First, let's manually apply the migrations we need
		info('Applying migration 0023 - Product sequences...');
		
		const migration0023 = `
			CREATE TABLE IF NOT EXISTS "product_sequences" (
				"year_month" varchar(6) PRIMARY KEY NOT NULL,
				"last_sequence" integer DEFAULT 0 NOT NULL,
				"created_at" timestamp DEFAULT now() NOT NULL,
				"updated_at" timestamp DEFAULT now() NOT NULL
			);
		`;
		
		await db.execute(sql.raw(migration0023));
		success('Product sequences table created');
		
		info('Applying migration 0025 - Display ID columns...');
		
		// Add display_id columns to each table
		const tables = ['offers', 'payments', 'product_offers', 'products'];
		
		for (const table of tables) {
			try {
				await db.execute(sql.raw(`
					ALTER TABLE "${table}" 
					ADD COLUMN IF NOT EXISTS "display_id" varchar(20)
				`));
				
				await db.execute(sql.raw(`
					CREATE INDEX IF NOT EXISTS "${table}_display_id_idx" 
					ON "${table}" ("display_id")
				`));
				
				await db.execute(sql.raw(`
					ALTER TABLE "${table}" 
					ADD CONSTRAINT "${table}_display_id_unique" 
					UNIQUE("display_id")
				`));
				
				success(`Added display_id to ${table}`);
			} catch (err: any) {
				if (err.message.includes('already exists')) {
					info(`display_id already exists in ${table}`);
				} else {
					warning(`Issue with ${table}: ${err.message}`);
				}
			}
		}
		
		// Add email_hash to users if not exists
		try {
			await db.execute(sql.raw(`
				ALTER TABLE "users" 
				ADD COLUMN IF NOT EXISTS "email_hash" text
			`));
			
			await db.execute(sql.raw(`
				CREATE INDEX IF NOT EXISTS "users_email_hash_idx" 
				ON "users" ("email_hash")
			`));
			
			success('Added email_hash to users');
		} catch (err: any) {
			if (err.message.includes('already exists')) {
				info('email_hash already exists in users');
			}
		}
		
		success('Migrations applied successfully');
	} catch (err) {
		error(`Failed to apply migrations: ${err}`);
		throw err;
	}
}

async function verifyDisplayIds() {
	info('Verifying display IDs...');
	
	const tables = [
		{ name: 'products', expectedPrefix: 'PRD' },
		{ name: 'product_offers', expectedPrefix: 'POFFER' },
		{ name: 'offers', expectedPrefix: 'OFFER' },
		{ name: 'payments', expectedPrefixes: ['ORD', 'PORD'] }
	];
	
	const results: any = {};
	
	for (const table of tables) {
		try {
			// Count total records
			const totalCountQuery = `SELECT COUNT(*) as count FROM "${table.name}"`;
			const totalCount = await db.execute(sql.raw(totalCountQuery));
			
			// Count records with display_id
			const withDisplayIdQuery = `SELECT COUNT(*) as count FROM "${table.name}" WHERE display_id IS NOT NULL`;
			const withDisplayId = await db.execute(sql.raw(withDisplayIdQuery));
			
			// Count records without display_id
			const withoutDisplayIdQuery = `SELECT COUNT(*) as count FROM "${table.name}" WHERE display_id IS NULL`;
			const withoutDisplayId = await db.execute(sql.raw(withoutDisplayIdQuery));
			
			results[table.name] = {
				total: totalCount[0]?.count || 0,
				withDisplayId: withDisplayId[0]?.count || 0,
				withoutDisplayId: withoutDisplayId[0]?.count || 0
			};
			
			// Sample some display IDs to verify format
			const samplesQuery = `SELECT display_id FROM "${table.name}" WHERE display_id IS NOT NULL LIMIT 3`;
			const samples = await db.execute(sql.raw(samplesQuery));
			
			if (samples && samples.length > 0) {
				info(`  Sample ${table.name} display IDs:`);
				samples.forEach((row: any) => {
					console.log(`    - ${row.display_id}`);
				});
			}
		} catch (err) {
			warning(`Could not verify ${table.name}: ${err}`);
		}
	}
	
	// Display summary
	console.log('\n📊 Display ID Summary:');
	console.log('─'.repeat(60));
	
	for (const [tableName, stats] of Object.entries(results)) {
		const s = stats as any;
		const percentage = s.total > 0 ? ((s.withDisplayId / s.total) * 100).toFixed(1) : '0';
		
		console.log(`${tableName}:`);
		console.log(`  Total records: ${s.total}`);
		console.log(`  With display_id: ${s.withDisplayId} (${percentage}%)`);
		console.log(`  Without display_id: ${s.withoutDisplayId}`);
		console.log('');
	}
	
	return results;
}

async function runPopulateScript() {
	info('Running populate-display-ids script...');
	
	try {
		const { stdout, stderr } = await execAsync('bun run scripts/populate-display-ids.ts');
		
		if (stderr) {
			warning(`Populate script warnings: ${stderr}`);
		}
		
		if (stdout) {
			info(stdout);
		}
		
		success('Display IDs populated successfully');
	} catch (err) {
		error(`Failed to populate display IDs: ${err}`);
		throw err;
	}
}

async function applyNotNullConstraints() {
	info('Applying NOT NULL constraints to display_id columns...');
	
	const tables = ['offers', 'payments', 'product_offers', 'products'];
	
	for (const table of tables) {
		try {
			await db.execute(sql.raw(`
				ALTER TABLE "${table}" 
				ALTER COLUMN "display_id" SET NOT NULL
			`));
			success(`Applied NOT NULL constraint to ${table}.display_id`);
		} catch (err) {
			warning(`Could not apply NOT NULL to ${table}: ${err}`);
		}
	}
}

async function main() {
	console.log('');
	log('🚀 Safe Database Migration Script', 'magenta');
	console.log('─'.repeat(60));
	
	const isProduction = process.env.DATABASE_URL?.includes('ep-frosty-mud');
	const environment = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';
	
	warning(`Environment: ${environment}`);
	console.log('');
	
	try {
		// Step 1: Create backup
		console.log('📦 Step 1: Creating backup');
		console.log('─'.repeat(60));
		const backupFile = await createBackup();
		console.log('');
		
		// Step 2: Check current status
		console.log('🔍 Step 2: Checking migration status');
		console.log('─'.repeat(60));
		const status = await checkMigrationStatus();
		
		if (status.hasDisplayColumns) {
			info('Display columns already exist in some tables:');
			status.existingColumns.forEach((col: any) => {
				console.log(`  - ${col.table_name}.${col.column_name}`);
			});
		} else {
			info('No display columns found. Fresh migration needed.');
		}
		
		if (status.hasSequenceTable) {
			info('Product sequences table already exists');
		}
		console.log('');
		
		// Step 3: Apply migrations
		console.log('🔄 Step 3: Applying migrations');
		console.log('─'.repeat(60));
		await applyMigrations();
		console.log('');
		
		// Step 4: Populate display IDs
		console.log('🔢 Step 4: Populating display IDs');
		console.log('─'.repeat(60));
		await runPopulateScript();
		console.log('');
		
		// Step 5: Verify display IDs
		console.log('✔️  Step 5: Verifying display IDs');
		console.log('─'.repeat(60));
		const verifyResults = await verifyDisplayIds();
		console.log('');
		
		// Check if all records have display IDs
		let allPopulated = true;
		for (const [_, stats] of Object.entries(verifyResults)) {
			const s = stats as any;
			if (s.withoutDisplayId > 0) {
				allPopulated = false;
				break;
			}
		}
		
		if (allPopulated) {
			// Step 6: Apply NOT NULL constraints
			console.log('🔒 Step 6: Applying NOT NULL constraints');
			console.log('─'.repeat(60));
			await applyNotNullConstraints();
			console.log('');
			
			success('Migration completed successfully!');
		} else {
			warning('Some records still missing display IDs.');
			warning('NOT NULL constraints not applied. Please investigate and run again.');
		}
		
		console.log('');
		console.log('─'.repeat(60));
		success('🎉 Migration process completed!');
		info(`Backup saved at: ${backupFile}`);
		
	} catch (err) {
		console.log('');
		console.log('─'.repeat(60));
		error('Migration failed!');
		error(`Error: ${err}`);
		info('Database has been backed up. You can restore if needed.');
		process.exit(1);
	}
}

// Run the migration
main().catch(console.error);
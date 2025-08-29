#!/usr/bin/env bun
/**
 * Rollback Migration Script
 * Restores database from backup or removes display ID changes
 *
 * Usage:
 * - For dev: bun run scripts/rollback-migration.ts [backup-file]
 * - For prod: bun --env-file=.env.prod run scripts/rollback-migration.ts [backup-file]
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { db } from '../src/lib/server/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

// Colors for terminal output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	cyan: '\x1b[36m'
};

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

async function promptUser(question: string): Promise<boolean> {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	return new Promise((resolve) => {
		rl.question(`${question} (yes/no): `, (answer) => {
			rl.close();
			resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
		});
	});
}

async function listBackups(): Promise<string[]> {
	const backupDir = path.join(process.cwd(), 'backups');

	if (!fs.existsSync(backupDir)) {
		return [];
	}

	const files = fs
		.readdirSync(backupDir)
		.filter((f) => f.endsWith('.sql'))
		.sort()
		.reverse(); // Most recent first

	return files.map((f) => path.join(backupDir, f));
}

async function restoreFromBackup(backupFile: string) {
	if (!fs.existsSync(backupFile)) {
		throw new Error(`Backup file not found: ${backupFile}`);
	}

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL not found in environment variables');
	}

	info(`Restoring from backup: ${backupFile}`);

	// Parse database name from URL
	const dbName = databaseUrl.split('/').pop()?.split('?')[0];

	try {
		// Drop all tables and restore
		warning('This will DROP all existing tables and restore from backup');
		const confirm = await promptUser('Are you sure you want to continue?');

		if (!confirm) {
			info('Rollback cancelled');
			return false;
		}

		// Create a temporary database URL for psql
		const tempUrl = databaseUrl.replace(`/${dbName}`, '/postgres');

		// Drop and recreate database
		info('Dropping existing database...');
		await execAsync(`psql "${tempUrl}" -c "DROP DATABASE IF EXISTS ${dbName}"`);
		await execAsync(`psql "${tempUrl}" -c "CREATE DATABASE ${dbName}"`);

		// Restore from backup
		info('Restoring database from backup...');
		await execAsync(`psql "${databaseUrl}" < "${backupFile}"`);

		success('Database restored successfully');
		return true;
	} catch (err) {
		error(`Failed to restore from backup: ${err}`);
		throw err;
	}
}

async function removeDisplayIdColumns() {
	info('Removing display ID columns and related changes...');

	try {
		// Start transaction
		await db.execute(sql`BEGIN`);

		// Drop constraints first
		const tables = ['products', 'product_offers', 'offers', 'payments'];

		for (const table of tables) {
			try {
				// Drop unique constraint
				await db.execute(
					sql.raw(`
					ALTER TABLE ${table} 
					DROP CONSTRAINT IF EXISTS ${table}_display_id_unique
				`)
				);

				// Drop index
				await db.execute(
					sql.raw(`
					DROP INDEX IF EXISTS ${table}_display_id_idx
				`)
				);

				// Drop column
				await db.execute(
					sql.raw(`
					ALTER TABLE ${table} 
					DROP COLUMN IF EXISTS display_id
				`)
				);

				info(`Removed display_id from ${table}`);
			} catch (err) {
				warning(`Could not remove display_id from ${table}: ${err}`);
			}
		}

		// Drop product_sequences table
		try {
			await db.execute(sql`DROP TABLE IF EXISTS product_sequences`);
			info('Removed product_sequences table');
		} catch (err) {
			warning(`Could not remove product_sequences table: ${err}`);
		}

		// Also remove tables from migration 0024 if they exist
		const newTables = [
			'cancellation_requests',
			'kakao_notifications',
			'payment_refunds',
			'refund_policies',
			'webhook_events'
		];

		for (const table of newTables) {
			try {
				await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table} CASCADE`));
				info(`Removed ${table} table`);
			} catch (err) {
				warning(`Could not remove ${table} table: ${err}`);
			}
		}

		// Remove added columns from existing tables
		try {
			await db.execute(sql`
				ALTER TABLE payments 
				DROP COLUMN IF EXISTS cancelled_at,
				DROP COLUMN IF EXISTS refunded_at,
				DROP COLUMN IF EXISTS refund_amount,
				DROP COLUMN IF EXISTS cancellation_request_id
			`);
			info('Removed payment refund columns');
		} catch (err) {
			warning(`Could not remove payment columns: ${err}`);
		}

		try {
			await db.execute(sql`
				ALTER TABLE product_offers
				DROP COLUMN IF EXISTS start_date,
				DROP COLUMN IF EXISTS end_date
			`);
			info('Removed product_offers date columns');
		} catch (err) {
			warning(`Could not remove product_offers columns: ${err}`);
		}

		try {
			await db.execute(sql`
				ALTER TABLE reviews
				DROP COLUMN IF EXISTS product_id,
				DROP COLUMN IF EXISTS product_offer_id
			`);
			info('Removed reviews product columns');
		} catch (err) {
			warning(`Could not remove reviews columns: ${err}`);
		}

		try {
			await db.execute(sql`
				ALTER TABLE users
				DROP COLUMN IF EXISTS email_hash
			`);
			info('Removed users email_hash column');
		} catch (err) {
			warning(`Could not remove users email_hash: ${err}`);
		}

		// Drop custom types
		const types = [
			'cancellation_reason_guide',
			'cancellation_reason_traveler',
			'cancellation_status',
			'kakao_notification_status'
		];

		for (const type of types) {
			try {
				await db.execute(sql.raw(`DROP TYPE IF EXISTS ${type} CASCADE`));
				info(`Removed ${type} type`);
			} catch (err) {
				warning(`Could not remove ${type} type: ${err}`);
			}
		}

		// Commit transaction
		await db.execute(sql`COMMIT`);

		success('Display ID changes removed successfully');
		return true;
	} catch (err) {
		// Rollback on error
		await db.execute(sql`ROLLBACK`);
		error(`Failed to remove display ID changes: ${err}`);
		throw err;
	}
}

async function main() {
	console.log('');
	console.log('🔙 Database Rollback Script');
	console.log('═'.repeat(60));

	const isProduction = process.env.DATABASE_URL?.includes('ep-frosty-mud');
	const environment = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';

	warning(`Environment: ${environment}`);

	if (isProduction) {
		console.log('');
		error('⚠️  WARNING: You are about to rollback PRODUCTION database!');
		console.log('');
	}

	const args = process.argv.slice(2);
	const backupFile = args[0];

	try {
		if (backupFile) {
			// Restore from specific backup
			if (!fs.existsSync(backupFile)) {
				error(`Backup file not found: ${backupFile}`);
				process.exit(1);
			}

			console.log('Option: Restore from backup file');
			console.log(`File: ${backupFile}`);
			console.log('');

			await restoreFromBackup(backupFile);
		} else {
			// Show options
			console.log('Choose rollback option:');
			console.log('1. Remove display ID changes only (keeps other data)');
			console.log('2. Restore from backup (complete restore)');
			console.log('3. Cancel');
			console.log('');

			const backups = await listBackups();

			if (backups.length > 0) {
				info('Available backups:');
				backups.slice(0, 5).forEach((backup, index) => {
					const filename = path.basename(backup);
					console.log(`  ${index + 1}. ${filename}`);
				});
				console.log('');
			}

			// For simplicity, we'll just remove display ID changes
			// In a real scenario, you'd implement a menu system

			const removeOnly = await promptUser('Remove display ID changes only?');

			if (removeOnly) {
				await removeDisplayIdColumns();
			} else {
				if (backups.length > 0) {
					info(`To restore from backup, run:`);
					console.log(`  bun run scripts/rollback-migration.ts ${backups[0]}`);
				} else {
					warning('No backups found in ./backups directory');
				}
			}
		}

		console.log('');
		console.log('═'.repeat(60));
		success('Rollback completed successfully!');
	} catch (err) {
		console.log('');
		console.log('═'.repeat(60));
		error('Rollback failed!');
		error(`Error: ${err}`);
		process.exit(1);
	}
}

// Run rollback
main().catch(console.error);

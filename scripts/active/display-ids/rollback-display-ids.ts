#!/usr/bin/env bun
/**
 * Rollback Script for Display ID Migration
 * Restores display_ids from backup tables
 */

import { db } from '../src/lib/server/db';
import { sql } from 'drizzle-orm';

// Configuration
const CONFIRM_ROLLBACK = process.env.CONFIRM_ROLLBACK === 'yes';
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true for safety

// Color codes
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
	log(`✅ ${message}`, colors.green);
}

function error(message: string) {
	log(`❌ ${message}`, colors.red);
}

function info(message: string) {
	log(`ℹ️  ${message}`, colors.blue);
}

function warning(message: string) {
	log(`⚠️  ${message}`, colors.yellow);
}

function critical(message: string) {
	log(`🚨 ${message}`, `${colors.bright}${colors.red}`);
}

async function checkBackupTable(tableName: string): Promise<boolean> {
	try {
		const result = await db.execute(sql`
			SELECT COUNT(*) as count 
			FROM information_schema.tables 
			WHERE table_name = ${`${tableName}_display_id_backup`}
		`);

		return result.rows[0]?.count > 0;
	} catch (err) {
		return false;
	}
}

async function rollbackTable(tableName: string): Promise<{ restored: number; failed: number }> {
	log(`\nProcessing ${tableName}...`);

	try {
		// Check if backup exists
		const backupExists = await checkBackupTable(tableName);
		if (!backupExists) {
			warning(`No backup found for ${tableName}`);
			return { restored: 0, failed: 0 };
		}

		// Get backup data
		const backupData = await db.execute(sql`
			SELECT id, display_id 
			FROM ${sql.raw(`${tableName}_display_id_backup`)}
		`);

		if (backupData.rows.length === 0) {
			info(`No data in backup for ${tableName}`);
			return { restored: 0, failed: 0 };
		}

		info(`Found ${backupData.rows.length} backup records`);

		if (DRY_RUN) {
			warning('DRY RUN - would restore these records');
			// Show sample
			const samples = backupData.rows.slice(0, 5);
			for (const row of samples) {
				console.log(`  Would restore: ${row.id} → ${row.display_id}`);
			}
			return { restored: backupData.rows.length, failed: 0 };
		}

		// Perform rollback
		let restored = 0;
		let failed = 0;

		for (const row of backupData.rows) {
			try {
				await db.execute(sql`
					UPDATE ${sql.raw(tableName)}
					SET display_id = ${row.display_id}
					WHERE id = ${row.id}
				`);
				restored++;

				if (restored % 10 === 0) {
					process.stdout.write(`\r  Restored: ${restored}/${backupData.rows.length}`);
				}
			} catch (err) {
				failed++;
				error(`Failed to restore ${row.id}: ${err}`);
			}
		}

		console.log(); // New line
		success(`Restored ${restored} records in ${tableName}`);

		if (failed > 0) {
			error(`Failed to restore ${failed} records`);
		}

		return { restored, failed };
	} catch (err) {
		error(`Error rolling back ${tableName}: ${err}`);
		return { restored: 0, failed: 0 };
	}
}

async function main() {
	log(`${colors.bright}${colors.cyan}Display ID Rollback Script${colors.reset}`);
	log('='.repeat(50));

	if (!CONFIRM_ROLLBACK) {
		critical('ROLLBACK BLOCKED!');
		error('You must explicitly confirm rollback.');
		info('Run with CONFIRM_ROLLBACK=yes to proceed.');
		process.exit(1);
	}

	if (DRY_RUN) {
		warning('Running in DRY RUN mode - no changes will be made');
		info('To perform actual rollback, run with DRY_RUN=false');
	} else {
		critical('⚠️  THIS WILL RESTORE OLD DISPLAY IDS! ⚠️');

		// Give user time to cancel
		console.log('\nStarting rollback in 5 seconds... (Press Ctrl+C to cancel)');
		for (let i = 5; i > 0; i--) {
			process.stdout.write(`\r  ${i}...  `);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		console.log('\n');
	}

	const tables = ['products', 'offers', 'payments', 'product_offers'];
	const stats: Record<string, { restored: number; failed: number }> = {};

	try {
		for (const table of tables) {
			stats[table] = await rollbackTable(table);
		}

		// Print summary
		console.log('\n' + '='.repeat(50));
		log(`${colors.bright}Rollback Summary${colors.reset}`);
		console.log('='.repeat(50));

		let totalRestored = 0;
		let totalFailed = 0;

		for (const table of tables) {
			const stat = stats[table];
			console.log(`\n${table}:`);
			console.log(`  Restored: ${stat.restored}`);
			if (stat.failed > 0) console.log(`  Failed: ${stat.failed}`);

			totalRestored += stat.restored;
			totalFailed += stat.failed;
		}

		console.log('\n' + '-'.repeat(50));
		console.log(`Total restored: ${totalRestored}`);
		if (totalFailed > 0) console.log(`Total failed: ${totalFailed}`);

		if (DRY_RUN) {
			info('\nThis was a dry run. No changes were made.');
			info('Run with DRY_RUN=false to perform actual rollback.');
		} else {
			if (totalFailed === 0) {
				success('\n🎉 Rollback completed successfully!');
			} else {
				warning('\n⚠️  Rollback completed with some failures.');
				error(`${totalFailed} records failed to restore.`);
			}
		}
	} catch (err) {
		critical(`Rollback failed: ${err}`);
		process.exit(1);
	}
}

// Run the rollback
main().catch((err) => {
	critical(`Unexpected error: ${err}`);
	process.exit(1);
});

#!/usr/bin/env bun
/**
 * Development Migration Script for Display IDs
 * Updates existing display_ids from old format to new format
 *
 * Old formats:
 * - PRODUCT_1755676035754_p2yptgpln
 * - ORDER_1755748358423_mxo1i5jmd
 *
 * New formats:
 * - PRD-YYMM-XXXXX (products)
 * - ORD-YYMM-XXXXX (offer orders)
 * - PORD-YYMM-XXXXX (product orders)
 * - OFFER-YYMM-XXXXX (offers)
 * - POFFER-YYMM-XXXXX (product offers)
 */

import { db } from '../src/lib/server/db';
import { offers, payments, products, productOffers } from '../src/lib/server/db/schema';
import { eq, like, or, sql } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 100;

// Custom alphabet for readable IDs (same as displayId.ts)
const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateShortId = customAlphabet(alphabet, 5);

// Color codes for terminal output
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

/**
 * Get YYMM format from a timestamp or current date
 */
function getYearMonth(date?: Date): string {
	const now = date || new Date();
	const year = now.getFullYear().toString().slice(-2);
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	return `${year}${month}`;
}

/**
 * Extract date from old format ID if possible
 */
function extractDateFromOldId(oldId: string): Date | null {
	// Try to extract timestamp from format like PRODUCT_1755676035754_p2yptgpln
	const match = oldId.match(/_(\d{13})_/);
	if (match) {
		const timestamp = parseInt(match[1], 10);
		return new Date(timestamp);
	}
	return null;
}

/**
 * Generate new display ID based on type and date
 */
function generateNewDisplayId(type: string, date?: Date): string {
	const yearMonth = getYearMonth(date);
	const shortId = generateShortId();

	switch (type) {
		case 'product':
			return `PRD-${yearMonth}-${shortId}`;
		case 'offer':
			return `OFFER-${yearMonth}-${shortId}`;
		case 'payment_offer':
			return `ORD-${yearMonth}-${shortId}`;
		case 'payment_product':
			return `PORD-${yearMonth}-${shortId}`;
		case 'product_offer':
			return `POFFER-${yearMonth}-${shortId}`;
		default:
			throw new Error(`Unknown type: ${type}`);
	}
}

/**
 * Check if display_id needs migration
 */
function needsMigration(displayId: string | null): boolean {
	if (!displayId) return false;

	// Check if it matches old formats
	return (
		displayId.startsWith('PRODUCT_') ||
		displayId.startsWith('ORDER_') ||
		(displayId.startsWith('OFFER_') && !displayId.match(/^OFFER-\d{4}-[A-Z0-9]{5}$/)) ||
		displayId.includes('_')
	);
}

async function migrateTable(
	tableName: string,
	table: any,
	type: string,
	getPaymentType?: (record: any) => string
) {
	log(`\n${colors.bright}Migrating ${tableName}...${colors.reset}`);

	try {
		// Count records needing migration
		const records = await db.select().from(table).execute();
		const needMigration = records.filter((r) => needsMigration(r.displayId));

		if (needMigration.length === 0) {
			success(`No records need migration in ${tableName}`);
			return { migrated: 0, skipped: records.length };
		}

		info(`Found ${needMigration.length} records to migrate out of ${records.length} total`);

		if (DRY_RUN) {
			warning('DRY RUN MODE - No actual changes will be made');

			// Show sample of what would be changed
			const samples = needMigration.slice(0, 5);
			console.log('\nSample migrations:');
			for (const record of samples) {
				const date = extractDateFromOldId(record.displayId);
				const finalType = getPaymentType ? getPaymentType(record) : type;
				const newId = generateNewDisplayId(finalType, date || record.createdAt);
				console.log(`  ${record.displayId} → ${newId}`);
			}

			return { migrated: needMigration.length, skipped: records.length - needMigration.length };
		}

		// Perform actual migration in batches
		let migrated = 0;
		let failed = 0;

		for (let i = 0; i < needMigration.length; i += BATCH_SIZE) {
			const batch = needMigration.slice(i, i + BATCH_SIZE);

			for (const record of batch) {
				try {
					const date = extractDateFromOldId(record.displayId);
					const finalType = getPaymentType ? getPaymentType(record) : type;
					const newId = generateNewDisplayId(finalType, date || record.createdAt);

					// Update the record
					await db.update(table).set({ displayId: newId }).where(eq(table.id, record.id)).execute();

					migrated++;

					if (migrated % 10 === 0) {
						process.stdout.write(`\r  Migrated: ${migrated}/${needMigration.length}`);
					}
				} catch (err) {
					failed++;
					error(`Failed to migrate record ${record.id}: ${err}`);
				}
			}
		}

		console.log(); // New line after progress
		success(`Migrated ${migrated} records in ${tableName}`);
		if (failed > 0) {
			error(`Failed to migrate ${failed} records`);
		}

		return { migrated, failed, skipped: records.length - needMigration.length };
	} catch (err) {
		error(`Error migrating ${tableName}: ${err}`);
		return { migrated: 0, failed: 0, skipped: 0 };
	}
}

async function main() {
	log(`${colors.bright}${colors.cyan}Display ID Migration Script (Development)${colors.reset}`);
	log('='.repeat(50));

	if (DRY_RUN) {
		warning('Running in DRY RUN mode - no changes will be made');
		info('To perform actual migration, run without DRY_RUN=true');
	} else {
		warning('This will modify your database!');
		info('To preview changes without modifying, run with DRY_RUN=true');

		// Give user time to cancel
		console.log('\nStarting migration in 3 seconds... (Press Ctrl+C to cancel)');
		await new Promise((resolve) => setTimeout(resolve, 3000));
	}

	const stats = {
		products: { migrated: 0, failed: 0, skipped: 0 },
		offers: { migrated: 0, failed: 0, skipped: 0 },
		payments: { migrated: 0, failed: 0, skipped: 0 },
		productOffers: { migrated: 0, failed: 0, skipped: 0 }
	};

	try {
		// Migrate products
		stats.products = await migrateTable('products', products, 'product');

		// Migrate offers
		stats.offers = await migrateTable('offers', offers, 'offer');

		// Migrate product_offers
		stats.productOffers = await migrateTable('product_offers', productOffers, 'product_offer');

		// Migrate payments (need to determine if it's for offer or product)
		stats.payments = await migrateTable('payments', payments, 'payment_offer', (record) => {
			// Check if it's a product payment based on the old display_id
			if (record.displayId && record.displayId.startsWith('PRODUCT_')) {
				return 'payment_product';
			}
			// Check if productOfferId is set
			if (record.productOfferId) {
				return 'payment_product';
			}
			return 'payment_offer';
		});

		// Print summary
		console.log('\n' + '='.repeat(50));
		log(`${colors.bright}Migration Summary${colors.reset}`);
		console.log('='.repeat(50));

		const tables = ['products', 'offers', 'payments', 'productOffers'];
		let totalMigrated = 0;
		let totalFailed = 0;
		let totalSkipped = 0;

		for (const tableName of tables) {
			const stat = stats[tableName as keyof typeof stats];
			console.log(`\n${tableName}:`);
			console.log(`  Migrated: ${stat.migrated}`);
			if (stat.failed > 0) console.log(`  Failed: ${stat.failed}`);
			console.log(`  Skipped: ${stat.skipped}`);

			totalMigrated += stat.migrated;
			totalFailed += stat.failed || 0;
			totalSkipped += stat.skipped;
		}

		console.log('\n' + '-'.repeat(50));
		console.log(`Total migrated: ${totalMigrated}`);
		if (totalFailed > 0) console.log(`Total failed: ${totalFailed}`);
		console.log(`Total skipped: ${totalSkipped}`);

		if (DRY_RUN) {
			info('\nThis was a dry run. No changes were made.');
			info('Run without DRY_RUN=true to perform actual migration.');
		} else {
			success('\nMigration completed successfully!');
		}
	} catch (err) {
		error(`Migration failed: ${err}`);
		process.exit(1);
	}
}

// Run the migration
main().catch((err) => {
	error(`Unexpected error: ${err}`);
	process.exit(1);
});

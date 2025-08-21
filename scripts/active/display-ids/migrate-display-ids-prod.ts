#!/usr/bin/env bun
/**
 * Production Migration Script for Display IDs
 * Updates existing display_ids from old format to new format
 * 
 * SAFETY FEATURES:
 * - Creates backup table before migration
 * - Validates all new IDs before applying
 * - Transaction-based updates
 * - Detailed logging
 * - Rollback capability
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
import { eq, sql } from 'drizzle-orm';
import { customAlphabet } from 'nanoid';
import fs from 'fs';
import path from 'path';

// Configuration - PRODUCTION requires explicit confirmation
const CONFIRM_PRODUCTION = process.env.CONFIRM_PRODUCTION === 'yes';
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true for safety
const CREATE_BACKUP = process.env.CREATE_BACKUP !== 'false'; // Default to true
const BATCH_SIZE = 50; // Smaller batch size for production

// Custom alphabet for readable IDs (same as displayId.ts)
const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateShortId = customAlphabet(alphabet, 5);

// Logging setup
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, `display-id-migration-${new Date().toISOString().replace(/:/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Color codes for terminal output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m',
	magenta: '\x1b[35m'
};

function writeLog(message: string) {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] ${message}`;
	logStream.write(logMessage + '\n');
}

function log(message: string, color = colors.reset) {
	console.log(`${color}${message}${colors.reset}`);
	writeLog(message.replace(/[\x1b\[\d+m]/g, '')); // Strip color codes for log file
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
 * Validate new display ID format
 */
function validateNewDisplayId(displayId: string, type: string): boolean {
	const patterns: Record<string, RegExp> = {
		product: /^PRD-\d{4}-[A-Z0-9]{5}$/,
		offer: /^OFFER-\d{4}-[A-Z0-9]{5}$/,
		payment_offer: /^ORD-\d{4}-[A-Z0-9]{5}$/,
		payment_product: /^PORD-\d{4}-[A-Z0-9]{5}$/,
		product_offer: /^POFFER-\d{4}-[A-Z0-9]{5}$/
	};
	
	return patterns[type]?.test(displayId) || false;
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
		displayId.startsWith('OFFER_') && !displayId.match(/^OFFER-\d{4}-[A-Z0-9]{5}$/) ||
		displayId.includes('_')
	);
}

/**
 * Create backup of display IDs
 */
async function createBackup(tableName: string): Promise<void> {
	if (!CREATE_BACKUP) return;
	
	try {
		// Create backup table
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS ${sql.raw(`${tableName}_display_id_backup`)} AS
			SELECT id, display_id, NOW() as backup_date
			FROM ${sql.raw(tableName)}
		`);
		
		success(`Created backup for ${tableName}`);
	} catch (err) {
		throw new Error(`Failed to create backup for ${tableName}: ${err}`);
	}
}

/**
 * Migrate a single table with safety checks
 */
async function migrateTable(
	tableName: string,
	table: any,
	type: string,
	getPaymentType?: (record: any) => string
) {
	log(`\n${colors.bright}${colors.magenta}Processing ${tableName}...${colors.reset}`);
	
	try {
		// Create backup first
		if (!DRY_RUN && CREATE_BACKUP) {
			await createBackup(tableName);
		}
		
		// Count records needing migration
		const records = await db.select().from(table).execute();
		const needMigration = records.filter(r => needsMigration(r.displayId));
		
		if (needMigration.length === 0) {
			success(`No records need migration in ${tableName}`);
			return { 
				migrated: 0, 
				skipped: records.length, 
				failed: 0,
				total: records.length 
			};
		}
		
		info(`Found ${needMigration.length} records to migrate out of ${records.length} total`);
		
		// Prepare migration plan
		const migrationPlan: Array<{
			id: string;
			oldId: string;
			newId: string;
			type: string;
		}> = [];
		
		const duplicateCheck = new Set<string>();
		
		for (const record of needMigration) {
			const date = extractDateFromOldId(record.displayId);
			const finalType = getPaymentType ? getPaymentType(record) : type;
			let newId = generateNewDisplayId(finalType, date || record.createdAt);
			
			// Ensure uniqueness
			let attempts = 0;
			while (duplicateCheck.has(newId) && attempts < 10) {
				newId = generateNewDisplayId(finalType, date || record.createdAt);
				attempts++;
			}
			
			if (attempts >= 10) {
				error(`Could not generate unique ID for record ${record.id}`);
				continue;
			}
			
			// Validate the new ID
			if (!validateNewDisplayId(newId, finalType)) {
				error(`Invalid new ID generated: ${newId} for type ${finalType}`);
				continue;
			}
			
			duplicateCheck.add(newId);
			migrationPlan.push({
				id: record.id,
				oldId: record.displayId,
				newId: newId,
				type: finalType
			});
		}
		
		if (DRY_RUN) {
			warning('DRY RUN MODE - No actual changes will be made');
			
			// Show sample of what would be changed
			console.log('\nMigration plan (first 10):');
			const samples = migrationPlan.slice(0, 10);
			for (const plan of samples) {
				console.log(`  ${plan.oldId} → ${plan.newId}`);
			}
			
			// Write full plan to log file
			writeLog('\nFull migration plan:');
			for (const plan of migrationPlan) {
				writeLog(`${plan.id}: ${plan.oldId} → ${plan.newId}`);
			}
			
			return { 
				migrated: migrationPlan.length, 
				skipped: records.length - needMigration.length,
				failed: 0,
				total: records.length
			};
		}
		
		// Perform actual migration
		let migrated = 0;
		let failed = 0;
		
		info('Starting migration...');
		
		for (let i = 0; i < migrationPlan.length; i += BATCH_SIZE) {
			const batch = migrationPlan.slice(i, i + BATCH_SIZE);
			
			// Use transaction for each batch
			await db.transaction(async (tx) => {
				for (const plan of batch) {
					try {
						await tx
							.update(table)
							.set({ displayId: plan.newId })
							.where(eq(table.id, plan.id))
							.execute();
						
						migrated++;
						writeLog(`SUCCESS: ${plan.id}: ${plan.oldId} → ${plan.newId}`);
						
						if (migrated % 10 === 0) {
							process.stdout.write(`\r  Progress: ${migrated}/${migrationPlan.length}`);
						}
					} catch (err) {
						failed++;
						const errorMsg = `FAILED: ${plan.id}: ${err}`;
						error(errorMsg);
						writeLog(errorMsg);
						throw err; // Rollback transaction
					}
				}
			}).catch((err) => {
				error(`Transaction failed for batch: ${err}`);
				failed += batch.length - (migrated % BATCH_SIZE);
			});
		}
		
		console.log(); // New line after progress
		
		if (migrated > 0) {
			success(`Successfully migrated ${migrated} records in ${tableName}`);
		}
		if (failed > 0) {
			error(`Failed to migrate ${failed} records in ${tableName}`);
		}
		
		return { 
			migrated, 
			failed, 
			skipped: records.length - needMigration.length,
			total: records.length
		};
		
	} catch (err) {
		const errorMsg = `Critical error migrating ${tableName}: ${err}`;
		critical(errorMsg);
		writeLog(errorMsg);
		throw err;
	}
}

async function main() {
	log(`${colors.bright}${colors.cyan}Display ID Migration Script (PRODUCTION)${colors.reset}`);
	log('=' .repeat(60));
	
	// Production safety checks
	if (!CONFIRM_PRODUCTION) {
		critical('PRODUCTION MIGRATION BLOCKED!');
		error('You must explicitly confirm production migration.');
		info('Run with CONFIRM_PRODUCTION=yes to proceed.');
		process.exit(1);
	}
	
	if (DRY_RUN) {
		warning('Running in DRY RUN mode - no changes will be made');
		info('To perform actual migration, run with DRY_RUN=false');
	} else {
		critical('⚠️  PRODUCTION DATABASE WILL BE MODIFIED! ⚠️');
		warning('Backup will be created: ' + (CREATE_BACKUP ? 'YES' : 'NO'));
		info('Log file: ' + logFile);
		
		// Give user time to cancel
		console.log('\n🚨 Starting PRODUCTION migration in 10 seconds... (Press Ctrl+C to cancel)');
		for (let i = 10; i > 0; i--) {
			process.stdout.write(`\r  ${i}...  `);
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		console.log('\n');
	}
	
	writeLog('Migration started');
	writeLog(`DRY_RUN: ${DRY_RUN}`);
	writeLog(`CREATE_BACKUP: ${CREATE_BACKUP}`);
	
	const stats = {
		products: { migrated: 0, failed: 0, skipped: 0, total: 0 },
		offers: { migrated: 0, failed: 0, skipped: 0, total: 0 },
		payments: { migrated: 0, failed: 0, skipped: 0, total: 0 },
		productOffers: { migrated: 0, failed: 0, skipped: 0, total: 0 }
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
		console.log('\n' + '='.repeat(60));
		log(`${colors.bright}Migration Summary${colors.reset}`);
		console.log('='.repeat(60));
		
		const tables = ['products', 'offers', 'payments', 'productOffers'];
		let totalMigrated = 0;
		let totalFailed = 0;
		let totalSkipped = 0;
		let grandTotal = 0;
		
		for (const tableName of tables) {
			const stat = stats[tableName as keyof typeof stats];
			console.log(`\n${tableName}:`);
			console.log(`  Total records: ${stat.total}`);
			console.log(`  Migrated: ${stat.migrated}`);
			if (stat.failed > 0) console.log(`  Failed: ${stat.failed}`);
			console.log(`  Skipped (already correct): ${stat.skipped}`);
			
			totalMigrated += stat.migrated;
			totalFailed += stat.failed;
			totalSkipped += stat.skipped;
			grandTotal += stat.total;
		}
		
		console.log('\n' + '-'.repeat(60));
		console.log(`Grand total records: ${grandTotal}`);
		console.log(`Total migrated: ${totalMigrated}`);
		if (totalFailed > 0) console.log(`Total failed: ${totalFailed}`);
		console.log(`Total skipped: ${totalSkipped}`);
		
		writeLog('\n' + '='.repeat(60));
		writeLog('Migration completed');
		writeLog(`Total migrated: ${totalMigrated}`);
		writeLog(`Total failed: ${totalFailed}`);
		writeLog(`Total skipped: ${totalSkipped}`);
		
		if (DRY_RUN) {
			info('\nThis was a dry run. No changes were made.');
			info('Review the log file for the full migration plan.');
			info('Run with DRY_RUN=false to perform actual migration.');
		} else {
			if (totalFailed === 0) {
				success('\n🎉 Migration completed successfully!');
				info(`Check log file for details: ${logFile}`);
				
				if (CREATE_BACKUP) {
					info('\nBackup tables created with suffix "_display_id_backup"');
					info('To rollback, you can restore from these backup tables.');
				}
			} else {
				warning('\n⚠️  Migration completed with some failures.');
				error(`${totalFailed} records failed to migrate.`);
				info(`Check log file for details: ${logFile}`);
			}
		}
		
	} catch (err) {
		critical(`Migration failed: ${err}`);
		writeLog(`CRITICAL ERROR: ${err}`);
		
		if (!DRY_RUN && CREATE_BACKUP) {
			info('\nBackup tables are available for recovery.');
			info('To rollback, restore from tables with suffix "_display_id_backup"');
		}
		
		process.exit(1);
	} finally {
		logStream.end();
	}
}

// Run the migration
main().catch((err) => {
	critical(`Unexpected error: ${err}`);
	writeLog(`UNEXPECTED ERROR: ${err}`);
	process.exit(1);
});
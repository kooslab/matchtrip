#!/usr/bin/env bun
/**
 * Script to shorten display ID suffixes from 6 to 5 characters
 * This is for records that already have the correct format but with 6-char suffixes
 * 
 * Current: PRD-2508-8V77DU (6 chars)
 * Target:  PRD-2508-8V77D (5 chars)
 */

import { db } from '../src/lib/server/db';
import { offers, payments, products, productOffers } from '../src/lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

// Configuration
const DRY_RUN = process.env.DRY_RUN !== 'false'; // Default to true for safety
const CONFIRM = process.env.CONFIRM === 'yes';

// Color codes
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
 * Check if a display ID needs shortening (has 6-char suffix)
 */
function needsShortening(displayId: string | null): boolean {
	if (!displayId) return false;
	
	// Match format like PRD-2508-XXXXXX (6 chars at end)
	const match = displayId.match(/^[A-Z]+-\d{4}-([A-Z0-9]{6})$/);
	return !!match;
}

/**
 * Shorten display ID by removing last character
 */
function shortenDisplayId(displayId: string): string {
	// Remove the last character from the suffix
	return displayId.slice(0, -1);
}

/**
 * Check for duplicates after shortening
 */
async function checkForDuplicates(records: any[]): Promise<Map<string, string[]>> {
	const shortened = new Map<string, string[]>();
	
	for (const record of records) {
		if (needsShortening(record.displayId)) {
			const newId = shortenDisplayId(record.displayId);
			if (!shortened.has(newId)) {
				shortened.set(newId, []);
			}
			shortened.get(newId)!.push(record.displayId);
		}
	}
	
	// Find duplicates
	const duplicates = new Map<string, string[]>();
	for (const [newId, oldIds] of shortened) {
		if (oldIds.length > 1) {
			duplicates.set(newId, oldIds);
		}
	}
	
	return duplicates;
}

async function shortenTableIds(
	tableName: string,
	table: any
) {
	log(`\n${colors.bright}${colors.magenta}Processing ${tableName}...${colors.reset}`);
	
	try {
		// Get all records
		const records = await db.select().from(table).execute();
		const needShortening = records.filter(r => needsShortening(r.displayId));
		
		if (needShortening.length === 0) {
			info(`No records need shortening in ${tableName}`);
			return { shortened: 0, skipped: records.length, failed: 0 };
		}
		
		info(`Found ${needShortening.length} records to shorten out of ${records.length} total`);
		
		// Check for potential duplicates
		const duplicates = await checkForDuplicates(records);
		if (duplicates.size > 0) {
			error(`Found potential duplicates after shortening:`);
			for (const [newId, oldIds] of duplicates) {
				console.log(`  ${newId} would be created from:`);
				oldIds.forEach(id => console.log(`    - ${id}`));
			}
			
			if (!DRY_RUN) {
				error('Cannot proceed with shortening due to duplicate conflicts');
				return { shortened: 0, skipped: records.length, failed: needShortening.length };
			}
		}
		
		if (DRY_RUN) {
			warning('DRY RUN MODE - No actual changes will be made');
			
			// Show sample of what would be changed
			console.log('\nSample changes (first 5):');
			const samples = needShortening.slice(0, 5);
			for (const record of samples) {
				const newId = shortenDisplayId(record.displayId);
				console.log(`  ${record.displayId} → ${newId}`);
			}
			
			return { 
				shortened: needShortening.length, 
				skipped: records.length - needShortening.length,
				failed: 0
			};
		}
		
		// Perform actual update
		let shortened = 0;
		let failed = 0;
		
		for (const record of needShortening) {
			try {
				const newId = shortenDisplayId(record.displayId);
				
				await db
					.update(table)
					.set({ displayId: newId })
					.where(eq(table.id, record.id))
					.execute();
				
				shortened++;
				
				if (shortened % 5 === 0) {
					process.stdout.write(`\r  Progress: ${shortened}/${needShortening.length}`);
				}
			} catch (err) {
				failed++;
				error(`Failed to shorten ${record.displayId}: ${err}`);
			}
		}
		
		console.log(); // New line
		
		if (shortened > 0) {
			success(`Successfully shortened ${shortened} records in ${tableName}`);
		}
		if (failed > 0) {
			error(`Failed to shorten ${failed} records`);
		}
		
		return { shortened, failed, skipped: records.length - needShortening.length };
		
	} catch (err) {
		error(`Error processing ${tableName}: ${err}`);
		return { shortened: 0, failed: 0, skipped: 0 };
	}
}

async function main() {
	log(`${colors.bright}${colors.cyan}Display ID Suffix Shortening Script${colors.reset}`);
	log('=' .repeat(50));
	
	if (!CONFIRM) {
		warning('You must confirm this operation');
		info('Run with CONFIRM=yes to proceed');
		process.exit(1);
	}
	
	if (DRY_RUN) {
		warning('Running in DRY RUN mode - no changes will be made');
		info('To perform actual shortening, run with DRY_RUN=false');
	} else {
		warning('⚠️  This will modify display IDs in the database!');
		
		// Give user time to cancel
		console.log('\nStarting in 5 seconds... (Press Ctrl+C to cancel)');
		for (let i = 5; i > 0; i--) {
			process.stdout.write(`\r  ${i}...  `);
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		console.log('\n');
	}
	
	const stats = {
		products: { shortened: 0, failed: 0, skipped: 0 },
		offers: { shortened: 0, failed: 0, skipped: 0 },
		payments: { shortened: 0, failed: 0, skipped: 0 },
		productOffers: { shortened: 0, failed: 0, skipped: 0 }
	};
	
	try {
		// Process each table
		stats.products = await shortenTableIds('products', products);
		stats.offers = await shortenTableIds('offers', offers);
		stats.productOffers = await shortenTableIds('product_offers', productOffers);
		stats.payments = await shortenTableIds('payments', payments);
		
		// Print summary
		console.log('\n' + '='.repeat(50));
		log(`${colors.bright}Summary${colors.reset}`);
		console.log('='.repeat(50));
		
		const tables = ['products', 'offers', 'payments', 'productOffers'];
		let totalShortened = 0;
		let totalFailed = 0;
		let totalSkipped = 0;
		
		for (const tableName of tables) {
			const stat = stats[tableName as keyof typeof stats];
			console.log(`\n${tableName}:`);
			console.log(`  Shortened: ${stat.shortened}`);
			if (stat.failed > 0) console.log(`  Failed: ${stat.failed}`);
			console.log(`  Skipped: ${stat.skipped}`);
			
			totalShortened += stat.shortened;
			totalFailed += stat.failed;
			totalSkipped += stat.skipped;
		}
		
		console.log('\n' + '-'.repeat(50));
		console.log(`Total shortened: ${totalShortened}`);
		if (totalFailed > 0) console.log(`Total failed: ${totalFailed}`);
		console.log(`Total skipped: ${totalSkipped}`);
		
		if (DRY_RUN) {
			info('\nThis was a dry run. No changes were made.');
			info('Run with DRY_RUN=false CONFIRM=yes to perform actual shortening.');
		} else {
			if (totalFailed === 0) {
				success('\n🎉 Shortening completed successfully!');
			} else {
				warning('\n⚠️  Shortening completed with some failures.');
			}
		}
		
	} catch (err) {
		error(`Script failed: ${err}`);
		process.exit(1);
	}
}

// Run the script
main().catch((err) => {
	error(`Unexpected error: ${err}`);
	process.exit(1);
});
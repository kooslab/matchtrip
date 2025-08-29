#!/usr/bin/env bun
/**
 * Verify Display IDs Script
 * Checks the status of display IDs in the database
 *
 * Usage:
 * - For dev: bun run scripts/verify-display-ids.ts
 * - For prod: bun --env-file=.env.prod run scripts/verify-display-ids.ts
 */

import { db } from '../src/lib/server/db';
import { sql } from 'drizzle-orm';
import { isValidDisplayId } from '../src/lib/server/utils/displayId';

// Colors for terminal output
const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
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

interface TableCheck {
	name: string;
	expectedPrefixes: string[];
}

const tables: TableCheck[] = [
	{ name: 'products', expectedPrefixes: ['PRD'] },
	{ name: 'product_offers', expectedPrefixes: ['POFFER'] },
	{ name: 'offers', expectedPrefixes: ['OFFER'] },
	{ name: 'payments', expectedPrefixes: ['ORD', 'PORD'] }
];

async function checkTable(table: TableCheck) {
	console.log(`\n📋 Checking ${table.name}...`);
	console.log('─'.repeat(40));

	try {
		// Check if column exists
		const columnExists = await db.execute(sql`
			SELECT EXISTS (
				SELECT FROM information_schema.columns
				WHERE table_schema = 'public'
				AND table_name = ${table.name}
				AND column_name = 'display_id'
			)
		`);

		if (!columnExists.rows[0]?.exists) {
			warning(`display_id column does not exist in ${table.name}`);
			return null;
		}

		// Get statistics
		const stats = await db.execute(sql`
			SELECT 
				COUNT(*) as total,
				COUNT(display_id) as with_display_id,
				COUNT(CASE WHEN display_id IS NULL THEN 1 END) as without_display_id
			FROM ${sql.identifier(table.name)}
		`);

		const total = Number(stats.rows[0]?.total || 0);
		const withDisplayId = Number(stats.rows[0]?.with_display_id || 0);
		const withoutDisplayId = Number(stats.rows[0]?.without_display_id || 0);

		// Get sample display IDs
		const samples = await db.execute(sql`
			SELECT display_id, id
			FROM ${sql.identifier(table.name)}
			WHERE display_id IS NOT NULL
			ORDER BY display_id DESC
			LIMIT 5
		`);

		// Check for invalid formats
		const invalidFormats = await db.execute(sql`
			SELECT display_id, id
			FROM ${sql.identifier(table.name)}
			WHERE display_id IS NOT NULL
			AND display_id NOT SIMILAR TO '[A-Z]+-[0-9]{4}-[A-Z0-9]{6}'
		`);

		// Check for duplicates
		const duplicates = await db.execute(sql`
			SELECT display_id, COUNT(*) as count
			FROM ${sql.identifier(table.name)}
			WHERE display_id IS NOT NULL
			GROUP BY display_id
			HAVING COUNT(*) > 1
		`);

		// Check for correct prefixes
		let prefixCheck = '';
		if (table.expectedPrefixes.length === 1) {
			prefixCheck = `display_id NOT LIKE '${table.expectedPrefixes[0]}-%'`;
		} else {
			const conditions = table.expectedPrefixes
				.map((p) => `display_id NOT LIKE '${p}-%'`)
				.join(' AND ');
			prefixCheck = `(${conditions})`;
		}

		const wrongPrefix = await db.execute(
			sql.raw(`
			SELECT display_id, id
			FROM ${table.name}
			WHERE display_id IS NOT NULL
			AND ${prefixCheck}
		`)
		);

		// Display results
		console.log(`Total records: ${total}`);
		console.log(
			`With display_id: ${withDisplayId} (${total > 0 ? ((withDisplayId / total) * 100).toFixed(1) : 0}%)`
		);
		console.log(`Without display_id: ${withoutDisplayId}`);

		if (samples.rows.length > 0) {
			console.log('\nSample display IDs:');
			samples.rows.forEach((row: any) => {
				const isValid = isValidDisplayId(row.display_id);
				const icon = isValid ? '✅' : '❌';
				console.log(`  ${icon} ${row.display_id}`);
			});
		}

		// Report issues
		let hasIssues = false;

		if (invalidFormats.rows.length > 0) {
			hasIssues = true;
			error(`Found ${invalidFormats.rows.length} records with invalid format`);
			invalidFormats.rows.slice(0, 3).forEach((row: any) => {
				console.log(`  - ${row.display_id} (ID: ${row.id})`);
			});
		}

		if (duplicates.rows.length > 0) {
			hasIssues = true;
			error(`Found ${duplicates.rows.length} duplicate display IDs`);
			duplicates.rows.slice(0, 3).forEach((row: any) => {
				console.log(`  - ${row.display_id} appears ${row.count} times`);
			});
		}

		if (wrongPrefix.rows.length > 0) {
			hasIssues = true;
			error(`Found ${wrongPrefix.rows.length} records with wrong prefix`);
			wrongPrefix.rows.slice(0, 3).forEach((row: any) => {
				console.log(
					`  - ${row.display_id} (expected prefix: ${table.expectedPrefixes.join(' or ')})`
				);
			});
		}

		if (withoutDisplayId > 0) {
			hasIssues = true;
			warning(`${withoutDisplayId} records still need display IDs`);
		}

		if (!hasIssues) {
			success(`All ${table.name} records have valid display IDs!`);
		}

		return {
			table: table.name,
			total,
			withDisplayId,
			withoutDisplayId,
			invalidFormats: invalidFormats.rows.length,
			duplicates: duplicates.rows.length,
			wrongPrefix: wrongPrefix.rows.length,
			isValid: !hasIssues
		};
	} catch (err) {
		error(`Failed to check ${table.name}: ${err}`);
		return null;
	}
}

async function checkConstraints() {
	console.log('\n🔒 Checking NOT NULL constraints...');
	console.log('─'.repeat(40));

	const constraints = await db.execute(sql`
		SELECT 
			table_name,
			column_name,
			is_nullable
		FROM information_schema.columns
		WHERE table_schema = 'public'
		AND column_name = 'display_id'
		AND table_name IN ('products', 'product_offers', 'offers', 'payments')
		ORDER BY table_name
	`);

	constraints.rows.forEach((row: any) => {
		const icon = row.is_nullable === 'NO' ? '✅' : '⚠️';
		const status = row.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE';
		console.log(`${icon} ${row.table_name}.${row.column_name}: ${status}`);
	});

	return constraints.rows;
}

async function checkSequenceTable() {
	console.log('\n🔢 Checking product_sequences table...');
	console.log('─'.repeat(40));

	try {
		const exists = await db.execute(sql`
			SELECT EXISTS (
				SELECT FROM information_schema.tables
				WHERE table_schema = 'public'
				AND table_name = 'product_sequences'
			)
		`);

		if (!exists.rows[0]?.exists) {
			warning('product_sequences table does not exist');
			return false;
		}

		success('product_sequences table exists');

		// Get some statistics
		const stats = await db.execute(sql`
			SELECT 
				COUNT(*) as total,
				MIN(year_month) as oldest,
				MAX(year_month) as newest,
				MAX(last_sequence) as max_sequence
			FROM product_sequences
		`);

		if (stats.rows[0]?.total > 0) {
			console.log(`  Total entries: ${stats.rows[0].total}`);
			console.log(`  Date range: ${stats.rows[0].oldest} to ${stats.rows[0].newest}`);
			console.log(`  Highest sequence: ${stats.rows[0].max_sequence}`);
		}

		return true;
	} catch (err) {
		error(`Failed to check product_sequences: ${err}`);
		return false;
	}
}

async function main() {
	console.log('');
	console.log('🔍 Display ID Verification Report');
	console.log('═'.repeat(60));

	const isProduction = process.env.DATABASE_URL?.includes('ep-frosty-mud');
	const environment = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';

	info(`Environment: ${environment}`);
	info(`Database: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'Unknown'}`);

	const results = [];

	// Check each table
	for (const table of tables) {
		const result = await checkTable(table);
		if (result) {
			results.push(result);
		}
	}

	// Check sequence table
	const hasSequenceTable = await checkSequenceTable();

	// Check constraints
	const constraints = await checkConstraints();

	// Summary
	console.log('\n');
	console.log('═'.repeat(60));
	console.log('📊 SUMMARY');
	console.log('═'.repeat(60));

	const allValid = results.every((r) => r?.isValid);
	const allNotNull = constraints.every((c: any) => c.is_nullable === 'NO');

	if (allValid && hasSequenceTable) {
		success('All tables have valid display IDs!');
	} else {
		warning('Some issues found. Please review the details above.');
	}

	if (allNotNull) {
		success('All display_id columns have NOT NULL constraints');
	} else {
		warning('Some display_id columns are still nullable');
	}

	// Statistics table
	console.log('\n📈 Statistics:');
	console.log('─'.repeat(60));
	console.table(
		results.map((r) => ({
			Table: r?.table || 'Unknown',
			Total: r?.total || 0,
			'With ID': r?.withDisplayId || 0,
			'Missing ID': r?.withoutDisplayId || 0,
			Invalid: r?.invalidFormats || 0,
			Duplicates: r?.duplicates || 0,
			'Wrong Prefix': r?.wrongPrefix || 0
		}))
	);

	process.exit(allValid ? 0 : 1);
}

// Run verification
main().catch(console.error);

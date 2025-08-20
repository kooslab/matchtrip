/**
 * Script to check database column lengths and constraints
 * Run with: bun run scripts/check-column-lengths.ts
 */

import { db } from '../src/lib/server/db';

async function checkColumnLengths() {
	console.log('🔍 Checking database column definitions...\n');

	try {
		// Query PostgreSQL system tables to get column information
		const result = await db.execute(`
			SELECT 
				column_name,
				data_type,
				character_maximum_length,
				is_nullable,
				column_default
			FROM information_schema.columns 
			WHERE table_name = 'users' 
			AND table_schema = 'public'
			ORDER BY ordinal_position;
		`);

		console.log('📊 Users table column definitions:');
		console.log('='.repeat(80));
		
		const rows = Array.isArray(result) ? result : (result.rows || []);
		for (const row of rows) {
			const col = row as any;
			console.log(`${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Max Length: ${col.character_maximum_length || 'unlimited'} | Nullable: ${col.is_nullable}`);
		}

		console.log('\n🔍 Checking encrypted data lengths in database...\n');

		// Get users and check their encrypted field lengths
		const usersResult = await db.execute(`
			SELECT 
				id,
				email,
				name,
				phone,
				LENGTH(email) as email_length,
				LENGTH(name) as name_length,
				LENGTH(phone) as phone_length
			FROM users 
			WHERE email LIKE 'encrypted:%' OR name LIKE 'encrypted:%' OR phone LIKE 'encrypted:%'
			ORDER BY created_at DESC
			LIMIT 10;
		`);

		console.log('📊 Recent encrypted data lengths:');
		console.log('='.repeat(100));
		console.log('User ID'.padEnd(36) + ' | Email Len | Name Len | Phone Len | Sample Email');
		console.log('='.repeat(100));

		const userRows = Array.isArray(usersResult) ? usersResult : (usersResult.rows || []);
		for (const row of userRows) {
			const user = row as any;
			const emailSample = user.email ? user.email.substring(0, 60) + '...' : 'null';
			console.log(
				`${user.id} | ${String(user.email_length || 0).padEnd(9)} | ${String(user.name_length || 0).padEnd(8)} | ${String(user.phone_length || 0).padEnd(9)} | ${emailSample}`
			);
		}

	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
checkColumnLengths();
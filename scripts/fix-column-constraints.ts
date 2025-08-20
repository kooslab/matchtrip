/**
 * Script to fix database column constraints for encrypted data
 * Run with: bun run scripts/fix-column-constraints.ts
 */

import { db } from '../src/lib/server/db';

async function fixColumnConstraints() {
	console.log('🔧 Fixing database column constraints for encrypted data...\n');

	try {
		// Check current column types
		console.log('1. Checking current column definitions...');
		const columnInfo = await db.execute(`
			SELECT 
				column_name,
				data_type,
				character_maximum_length
			FROM information_schema.columns 
			WHERE table_name = 'users' 
				AND table_schema = 'public'
				AND column_name IN ('email', 'name', 'phone')
			ORDER BY column_name;
		`);

		const rows = Array.isArray(columnInfo) ? columnInfo : (columnInfo.rows || []);
		console.log('Current column types:');
		for (const row of rows) {
			const col = row as any;
			console.log(`  ${col.column_name}: ${col.data_type} (max length: ${col.character_maximum_length || 'unlimited'})`);
		}

		// Fix column types to ensure they are unlimited TEXT
		console.log('\n2. Updating column types to TEXT...');
		
		await db.execute(`ALTER TABLE "users" ALTER COLUMN "email" TYPE TEXT;`);
		console.log('  ✅ Updated email column to TEXT');
		
		await db.execute(`ALTER TABLE "users" ALTER COLUMN "name" TYPE TEXT;`);
		console.log('  ✅ Updated name column to TEXT');
		
		await db.execute(`ALTER TABLE "users" ALTER COLUMN "phone" TYPE TEXT;`);
		console.log('  ✅ Updated phone column to TEXT');

		// Verify the changes
		console.log('\n3. Verifying column types after update...');
		const verifyResult = await db.execute(`
			SELECT 
				column_name,
				data_type,
				character_maximum_length
			FROM information_schema.columns 
			WHERE table_name = 'users' 
				AND table_schema = 'public'
				AND column_name IN ('email', 'name', 'phone')
			ORDER BY column_name;
		`);

		const verifyRows = Array.isArray(verifyResult) ? verifyResult : (verifyResult.rows || []);
		console.log('Updated column types:');
		for (const row of verifyRows) {
			const col = row as any;
			console.log(`  ${col.column_name}: ${col.data_type} (max length: ${col.character_maximum_length || 'unlimited'})`);
		}

		console.log('\n✨ Column constraints have been fixed!');
		console.log('Now you can safely delete users with truncated encrypted data and try Kakao login again.');

	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
fixColumnConstraints();
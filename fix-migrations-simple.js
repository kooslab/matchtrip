import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function fixMigrations() {
	try {
		console.log('🔧 Fixing migration state...\n');

		// Since your tables already exist and match the current schema,
		// we'll mark ALL migrations as applied except the very last one
		// which seems to be causing the issue.

		// The issue is that migration 0000_dashing_gambit is trying to create
		// the "accounts" table which already exists, so we need to mark
		// migrations as applied up to the point where your current schema matches.

		console.log('Step 1: Marking all existing migrations as applied...');

		// List of migration hashes - we'll use a different approach
		// Let's manually insert records for the known migrations using the correct format

		const migrationEntries = [
			// These are the migrations that created your current schema
			// Using the original timestamps from the journal (in milliseconds)
			{ hash: '0000_dashing_gambit', created_at: 1742153514882 },
			{ hash: '0001_yielding_smiling_tiger', created_at: 1747639470911 },
			{ hash: '0002_uneven_callisto', created_at: 1747639609607 },
			{ hash: '0003_chief_jean_grey', created_at: 1747645977624 },
			{ hash: '0004_dark_reavers', created_at: 1747648099672 },
			{ hash: '0005_lucky_wendigo', created_at: 1748310781225 },
			{ hash: '0006_silky_sentinels', created_at: 1748317552444 },
			{ hash: '0007_concerned_elektra', created_at: 1748325085967 },
			{ hash: '0008_brave_fallen_one', created_at: 1748327549087 },
			{ hash: '0009_abnormal_thunderball', created_at: 1749090990533 },
			{ hash: '0010_swift_dagger', created_at: 1749496582981 }
			// We'll leave 0011_young_shooting_star out so it can be applied normally
		];

		for (const entry of migrationEntries) {
			try {
				await sql`
           INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
           VALUES (${entry.hash}, ${entry.created_at})
         `;
				console.log(`✅ Marked as applied: ${entry.hash}`);
			} catch (err) {
				console.log(`⚠️  Skipped ${entry.hash}: ${err.message}`);
			}
		}

		console.log('\n🎉 Migration state fixed!');
		console.log('\nNow try running the latest migration:');
		console.log('bun run db:migrate');
	} catch (error) {
		console.error('❌ Error:', error);
	} finally {
		await sql.end();
	}
}

fixMigrations();

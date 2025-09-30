import { readFileSync } from 'fs';
import postgres from 'postgres';

// Read environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL not found in environment');
	process.exit(1);
}

console.log('🔗 Connecting to database...');

// Create postgres client with longer timeout
const sql = postgres(DATABASE_URL, {
	max: 1,
	idle_timeout: 20,
	connect_timeout: 60 // 60 seconds timeout
});

async function applyMigration() {
	try {
		console.log('📖 Reading migration file...');
		const migration = readFileSync('./drizzle/0033_events_table.sql', 'utf-8');

		// Split by statement-breakpoint
		const statements = migration
			.split('--> statement-breakpoint')
			.map(s => s.trim())
			.filter(s => s.length > 0);

		console.log(`✅ Found ${statements.length} SQL statements`);

		for (let i = 0; i < statements.length; i++) {
			const statement = statements[i];
			console.log(`\n[${i + 1}/${statements.length}] Executing...`);
			console.log(statement.substring(0, 100) + '...');

			try {
				await sql.unsafe(statement);
				console.log('✓ Success');
			} catch (err) {
				// Check if error is "already exists" which is OK
				if (err.message?.includes('already exists')) {
					console.log('⚠️  Already exists, skipping...');
				} else {
					throw err;
				}
			}
		}

		console.log('\n🎉 Migration applied successfully!');
	} catch (error) {
		console.error('\n❌ Migration failed:', error.message);
		process.exit(1);
	} finally {
		await sql.end();
	}
}

applyMigration();
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function checkMigrations() {
	try {
		console.log('Checking migration state...\n');

		// Check if migration table exists
		const migrationTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'drizzle' 
        AND table_name = '__drizzle_migrations'
      );
    `;

		if (!migrationTableExists[0].exists) {
			console.log('❌ Migration table does not exist');
			return;
		}

		console.log('✅ Migration table exists');

		// Get applied migrations
		const appliedMigrations = await sql`
      SELECT hash, created_at 
      FROM drizzle.__drizzle_migrations 
      ORDER BY created_at;
    `;

		console.log(`\nApplied migrations (${appliedMigrations.length}):`);
		appliedMigrations.forEach((migration, i) => {
			console.log(`${i + 1}. ${migration.hash} (${migration.created_at})`);
		});

		// Check which tables exist
		const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;

		console.log(`\nExisting tables (${tables.length}):`);
		tables.forEach((table) => {
			console.log(`- ${table.table_name}`);
		});
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await sql.end();
	}
}

checkMigrations();

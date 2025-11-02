import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set');
}

const sql = postgres(process.env.DATABASE_URL);
const db = drizzle(sql);

async function syncMigrations() {
	console.log('📦 Syncing production migration state...');
	console.log('DATABASE_URL:', process.env.DATABASE_URL);

	const syncSQL = readFileSync(join(process.cwd(), 'scripts/sync-prod-migrations.sql'), 'utf-8');

	try {
		await sql.unsafe(syncSQL);
		console.log('✅ Migration state synced successfully!');
		console.log('\nNow you can run: bun run db:migrate:prod');
	} catch (error) {
		console.error('❌ Error syncing migrations:', error);
		throw error;
	} finally {
		await sql.end();
	}
}

syncMigrations();

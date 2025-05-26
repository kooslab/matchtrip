import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let databaseUrl: string | undefined;

try {
	// Try SvelteKit env import
	// @ts-ignore
	databaseUrl = (await import('$env/dynamic/private')).env.DATABASE_URL;
} catch {
	// Fallback for scripts
	databaseUrl = process.env.DATABASE_URL;
}

if (!databaseUrl) throw new Error('DATABASE_URL is not set');
const client = postgres(databaseUrl);

export const db = drizzle(client, {
	schema
});

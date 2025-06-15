import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as relations from './relations';

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

// Configure postgres client with connection pooling for better performance
const client = postgres(databaseUrl, {
	max: 10, // Maximum number of connections in the pool
	idle_timeout: 20, // Close idle connections after 20 seconds
	connect_timeout: 10, // Connection timeout in seconds
	prepare: false // Disable prepared statements for better compatibility
});

export const db = drizzle(client, {
	schema: { ...schema, ...relations }
});

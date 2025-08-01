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

if (!databaseUrl) {
	console.error('[DB] DATABASE_URL is not set');
	throw new Error('DATABASE_URL is not set');
}

// Parse and display database URL without password
const parseDatabaseUrl = (url: string) => {
	try {
		const urlObj = new URL(url);
		const { protocol, hostname, port, pathname, username } = urlObj;
		const portStr = port ? `:${port}` : '';
		return `${protocol}//${username}:****@${hostname}${portStr}${pathname}`;
	} catch {
		return 'Invalid database URL format';
	}
};

console.log('[DB] Connecting to database...');
console.log('[DB] Database URL:', parseDatabaseUrl(databaseUrl));

// Configure postgres client with connection pooling for better performance
const client = postgres(databaseUrl, {
	max: 10, // Maximum number of connections in the pool
	idle_timeout: 20, // Close idle connections after 20 seconds
	connect_timeout: 10, // Connection timeout in seconds
	prepare: false, // Disable prepared statements for better compatibility
	onnotice: (notice) => {
		console.log('[DB] Notice:', notice);
	}
});

export const db = drizzle(client, {
	schema: { ...schema, ...relations }
});

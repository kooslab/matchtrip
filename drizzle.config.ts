import { defineConfig } from 'drizzle-kit';
import dns from 'node:dns';

// Force IPv4 for M1 Macs - this fixes Neon connection timeouts
dns.setDefaultResultOrder('ipv4first');

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
console.log('DATABASE_URL: ', process.env.DATABASE_URL);

// Keep the pooler connection for migrations - it works over HTTP and bypasses firewall
// DON'T remove -pooler since port 5432 is being blocked
const connectionString = process.env.DATABASE_URL.replace(
	'postgresql://',
	'postgres://'
);

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dbCredentials: {
		url: connectionString,
	},
	verbose: true,
	strict: true,
	dialect: 'postgresql',
	out: './drizzle'
});

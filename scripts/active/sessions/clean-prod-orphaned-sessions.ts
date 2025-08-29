/**
 * Script to clean up orphaned sessions in PRODUCTION
 * Run with: DATABASE_URL="prod_url" bun run scripts/clean-prod-orphaned-sessions.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, sessions } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function cleanProdOrphanedSessions() {
	// Use production database URL
	const DATABASE_URL =
		process.env.DATABASE_URL ||
		'postgresql://dev_owner:npg_JyqW5RA0ZePO@ep-frosty-mud-a2r43wg5-pooler.eu-central-1.aws.neon.tech/dev?sslmode=require&channel_binding=require';

	console.log('🧹 Cleaning up orphaned sessions in PRODUCTION...\n');
	console.log('📡 Database URL:', DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

	const client = postgres(DATABASE_URL);
	const db = drizzle(client);

	try {
		// Find all sessions
		const allSessions = await db.select().from(sessions);
		console.log(`📊 Total sessions: ${allSessions.length}`);

		// Get all user IDs
		const allUsers = await db.select({ id: users.id }).from(users);
		const userIds = new Set(allUsers.map((u) => u.id));
		console.log(`📊 Total users: ${allUsers.length}`);

		// Find orphaned sessions
		const orphanedSessions = allSessions.filter((session) => !userIds.has(session.userId));
		console.log(`🔍 Found ${orphanedSessions.length} orphaned sessions`);

		if (orphanedSessions.length === 0) {
			console.log('✨ No orphaned sessions found!');
			await client.end();
			return;
		}

		// Show details of orphaned sessions
		console.log('\n📋 Orphaned sessions:');
		for (const session of orphanedSessions) {
			console.log(`  - Session ${session.id} for missing user ${session.userId}`);
		}

		// Delete orphaned sessions
		console.log('\n🗑️  Deleting orphaned sessions...');
		for (const session of orphanedSessions) {
			await db.delete(sessions).where(eq(sessions.id, session.id));
			console.log(`  ✅ Deleted session ${session.id}`);
		}

		console.log(`\n✨ Successfully cleaned up ${orphanedSessions.length} orphaned sessions!`);
		console.log('Users can now login with Kakao without issues.');
	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	} finally {
		await client.end();
	}

	process.exit(0);
}

// Run the script
cleanProdOrphanedSessions();

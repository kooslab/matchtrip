/**
 * Script to clean up orphaned sessions (sessions without corresponding users)
 * Run with: bun run scripts/clean-orphaned-sessions.ts
 */

import { db } from '../src/lib/server/db';
import { users, sessions } from '../src/lib/server/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';

async function cleanOrphanedSessions() {
	console.log('🧹 Cleaning up orphaned sessions...\n');

	try {
		// Find all sessions
		const allSessions = await db.select().from(sessions);
		console.log(`📊 Total sessions: ${allSessions.length}`);

		// Get all user IDs
		const allUsers = await db.select({ id: users.id }).from(users);
		const userIds = new Set(allUsers.map(u => u.id));
		console.log(`📊 Total users: ${allUsers.length}`);

		// Find orphaned sessions
		const orphanedSessions = allSessions.filter(session => !userIds.has(session.userId));
		console.log(`🔍 Found ${orphanedSessions.length} orphaned sessions`);

		if (orphanedSessions.length === 0) {
			console.log('✨ No orphaned sessions found!');
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
	}

	process.exit(0);
}

// Run the script
cleanOrphanedSessions();
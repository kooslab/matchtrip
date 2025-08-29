/**
 * Script to delete the specific corrupted user
 * Run with: bun run scripts/delete-user-85f5b50a.ts
 */

import { db } from '../src/lib/server/db';
import { users, sessions, accounts } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function deleteSpecificUser() {
	console.log('🗑️ Deleting specific corrupted user: 85f5b50a-2b2a-4f22-a86d-1837a9798de4\n');

	try {
		const userId = '85f5b50a-2b2a-4f22-a86d-1837a9798de4';

		// Check if user exists first
		const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (existingUser.length === 0) {
			console.log('❌ User not found in database');
			return;
		}

		console.log('📊 Found user:', existingUser[0]);

		// Delete related sessions
		const deletedSessions = await db.delete(sessions).where(eq(sessions.userId, userId));
		console.log(`  ✅ Deleted sessions for user ${userId}`);

		// Delete related accounts
		const deletedAccounts = await db.delete(accounts).where(eq(accounts.userId, userId));
		console.log(`  ✅ Deleted accounts for user ${userId}`);

		// Delete the user
		const deletedUser = await db.delete(users).where(eq(users.id, userId));
		console.log(`  ✅ Deleted user ${userId}`);

		console.log('\n✨ Successfully deleted the corrupted user and all related data!');
		console.log('The cookieCache has been disabled, so new Kakao logins should work correctly.');
	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
deleteSpecificUser();

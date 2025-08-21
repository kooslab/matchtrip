/**
 * Script to delete users with corrupted encrypted data
 * Run with: bun run scripts/delete-corrupted-users.ts
 */

import { db } from '../src/lib/server/db';
import { users, sessions, accounts } from '../src/lib/server/db/schema';
import { isEncrypted, decrypt } from '../src/lib/server/encryption';
import { eq } from 'drizzle-orm';

async function deleteCorruptedUsers() {
	console.log('🗑️  Finding and deleting users with corrupted encrypted data...\n');

	try {
		// Get all users
		const allUsers = await db.select().from(users);
		
		let corruptedUsers = [];

		for (const user of allUsers) {
			let isCorrupted = false;

			// Check email
			if (user.email && isEncrypted(user.email)) {
				try {
					decrypt(user.email);
				} catch (error) {
					console.log(`❌ User ${user.id} has corrupted email: ${user.email}`);
					isCorrupted = true;
				}
			}

			// Check name
			if (user.name && isEncrypted(user.name)) {
				try {
					decrypt(user.name);
				} catch (error) {
					console.log(`❌ User ${user.id} has corrupted name: ${user.name}`);
					isCorrupted = true;
				}
			}

			// Check phone
			if (user.phone && isEncrypted(user.phone)) {
				try {
					decrypt(user.phone);
				} catch (error) {
					console.log(`❌ User ${user.id} has corrupted phone: ${user.phone}`);
					isCorrupted = true;
				}
			}

			if (isCorrupted) {
				corruptedUsers.push(user);
			}
		}

		console.log(`\n📊 Found ${corruptedUsers.length} corrupted users out of ${allUsers.length} total users`);

		if (corruptedUsers.length === 0) {
			console.log('✨ No corrupted users found!');
			return;
		}

		// Delete corrupted users and their related data
		for (const user of corruptedUsers) {
			console.log(`\n🗑️  Deleting corrupted user: ${user.id}`);

			// Delete related sessions
			await db.delete(sessions).where(eq(sessions.userId, user.id));
			console.log(`  ✅ Deleted sessions for user ${user.id}`);

			// Delete related accounts
			await db.delete(accounts).where(eq(accounts.userId, user.id));
			console.log(`  ✅ Deleted accounts for user ${user.id}`);

			// Delete the user
			await db.delete(users).where(eq(users.id, user.id));
			console.log(`  ✅ Deleted user ${user.id}`);
		}

		console.log(`\n✨ Successfully deleted ${corruptedUsers.length} corrupted users and their related data!`);
		console.log('You can now try Kakao login again with fresh data.');

	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
deleteCorruptedUsers();
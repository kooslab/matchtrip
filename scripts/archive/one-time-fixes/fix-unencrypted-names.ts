/**
 * Script to fix unencrypted user names in the database
 * Run with: bun run scripts/fix-unencrypted-names.ts
 */

import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { encrypt, isEncrypted } from '../src/lib/server/encryption';
import { eq } from 'drizzle-orm';

async function fixUnencryptedNames() {
	console.log('🔍 Checking for unencrypted user names...\n');

	try {
		// Get all users
		const allUsers = await db.select().from(users);

		let unencryptedCount = 0;
		let fixedCount = 0;
		let errorCount = 0;

		for (const user of allUsers) {
			// Skip if name is null or undefined
			if (!user.name) {
				continue;
			}

			// Check if the name is already encrypted
			if (!isEncrypted(user.name)) {
				unencryptedCount++;
				console.log(`Found unencrypted name for user ${user.id}: "${user.name}"`);

				try {
					// Encrypt the name
					const encryptedName = encrypt(user.name);

					if (encryptedName) {
						// Update the user with encrypted name
						await db.update(users).set({ name: encryptedName }).where(eq(users.id, user.id));

						fixedCount++;
						console.log(`✅ Encrypted name for user ${user.id}`);
					} else {
						errorCount++;
						console.error(
							`❌ Failed to encrypt name for user ${user.id} - encryption returned null`
						);
					}
				} catch (error) {
					errorCount++;
					console.error(`❌ Error encrypting name for user ${user.id}:`, error);
				}
			}
		}

		console.log('\n📊 Summary:');
		console.log(`Total users checked: ${allUsers.length}`);
		console.log(`Unencrypted names found: ${unencryptedCount}`);
		console.log(`Successfully fixed: ${fixedCount}`);
		console.log(`Errors: ${errorCount}`);

		if (unencryptedCount === 0) {
			console.log('\n✨ All user names are already encrypted!');
		} else if (fixedCount === unencryptedCount) {
			console.log('\n✨ Successfully encrypted all unencrypted names!');
		} else if (errorCount > 0) {
			console.log(
				'\n⚠️ Some names could not be encrypted. Please check the ENCRYPTION_KEY environment variable.'
			);
		}
	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
fixUnencryptedNames();

/**
 * Script to fix unencrypted emails and phones in the database
 * Run with: bun run scripts/fix-unencrypted-emails.ts
 */

import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { encrypt, isEncrypted } from '../src/lib/server/encryption';
import { eq } from 'drizzle-orm';

async function fixUnencryptedData() {
	console.log('🔍 Checking for unencrypted user emails and phones...\n');

	try {
		// Get all users
		const allUsers = await db.select().from(users);
		
		let unencryptedEmailCount = 0;
		let unencryptedPhoneCount = 0;
		let fixedEmailCount = 0;
		let fixedPhoneCount = 0;
		let errorCount = 0;

		for (const user of allUsers) {
			let needsUpdate = false;
			const updates: any = {};

			// Check email encryption
			if (user.email && !isEncrypted(user.email)) {
				unencryptedEmailCount++;
				console.log(`Found unencrypted email for user ${user.id}: "${user.email}"`);

				try {
					const encryptedEmail = encrypt(user.email);
					if (encryptedEmail) {
						updates.email = encryptedEmail;
						needsUpdate = true;
						fixedEmailCount++;
						console.log(`✅ Will encrypt email for user ${user.id}`);
					} else {
						errorCount++;
						console.error(`❌ Failed to encrypt email for user ${user.id} - encryption returned null`);
					}
				} catch (error) {
					errorCount++;
					console.error(`❌ Error encrypting email for user ${user.id}:`, error);
				}
			}

			// Check phone encryption
			if (user.phone && !isEncrypted(user.phone)) {
				unencryptedPhoneCount++;
				console.log(`Found unencrypted phone for user ${user.id}: "${user.phone}"`);

				try {
					const encryptedPhone = encrypt(user.phone);
					if (encryptedPhone) {
						updates.phone = encryptedPhone;
						needsUpdate = true;
						fixedPhoneCount++;
						console.log(`✅ Will encrypt phone for user ${user.id}`);
					} else {
						errorCount++;
						console.error(`❌ Failed to encrypt phone for user ${user.id} - encryption returned null`);
					}
				} catch (error) {
					errorCount++;
					console.error(`❌ Error encrypting phone for user ${user.id}:`, error);
				}
			}

			// Update the user if needed
			if (needsUpdate) {
				try {
					await db
						.update(users)
						.set(updates)
						.where(eq(users.id, user.id));
					console.log(`✅ Updated user ${user.id} with encrypted data`);
				} catch (error) {
					errorCount++;
					console.error(`❌ Error updating user ${user.id}:`, error);
				}
			}
		}

		console.log('\n📊 Summary:');
		console.log(`Total users checked: ${allUsers.length}`);
		console.log(`Unencrypted emails found: ${unencryptedEmailCount}`);
		console.log(`Unencrypted phones found: ${unencryptedPhoneCount}`);
		console.log(`Emails successfully encrypted: ${fixedEmailCount}`);
		console.log(`Phones successfully encrypted: ${fixedPhoneCount}`);
		console.log(`Errors: ${errorCount}`);

		if (unencryptedEmailCount === 0 && unencryptedPhoneCount === 0) {
			console.log('\n✨ All user emails and phones are already encrypted!');
		} else if (fixedEmailCount === unencryptedEmailCount && fixedPhoneCount === unencryptedPhoneCount) {
			console.log('\n✨ Successfully encrypted all unencrypted data!');
		} else if (errorCount > 0) {
			console.log('\n⚠️ Some data could not be encrypted. Please check the ENCRYPTION_KEY environment variable.');
		}

	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
fixUnencryptedData();
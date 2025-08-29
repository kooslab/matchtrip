/**
 * Script to diagnose encryption issues in the production database
 * Run with: bun run scripts/diagnose-encryption-issues.ts
 */

import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { encrypt, decrypt, isEncrypted } from '../src/lib/server/encryption';

async function diagnoseEncryptionIssues() {
	console.log('🔍 Diagnosing encryption issues in production database...\n');

	try {
		// Get all users
		const allUsers = await db.select().from(users);

		let totalUsers = allUsers.length;
		let encryptedEmails = 0;
		let encryptedNames = 0;
		let encryptedPhones = 0;
		let corruptedEmails = 0;
		let corruptedNames = 0;
		let corruptedPhones = 0;
		let plainEmails = 0;
		let plainNames = 0;
		let plainPhones = 0;

		console.log(`Checking ${totalUsers} users...\n`);

		for (const user of allUsers) {
			console.log(`\n👤 User ${user.id}:`);

			// Check email
			if (user.email) {
				if (isEncrypted(user.email)) {
					try {
						const decrypted = decrypt(user.email);
						console.log(`  📧 Email: encrypted ✅ (decrypts to: ${decrypted?.substring(0, 3)}***)`);
						encryptedEmails++;
					} catch (error) {
						console.log(`  📧 Email: encrypted ❌ (CORRUPTED - cannot decrypt)`);
						console.log(`      Raw value: ${user.email.substring(0, 50)}...`);
						corruptedEmails++;
					}
				} else {
					console.log(`  📧 Email: plain text ⚠️  (${user.email?.substring(0, 3)}***)`);
					plainEmails++;
				}
			} else {
				console.log(`  📧 Email: null/empty`);
			}

			// Check name
			if (user.name) {
				if (isEncrypted(user.name)) {
					try {
						const decrypted = decrypt(user.name);
						console.log(`  👤 Name: encrypted ✅ (decrypts to: ${decrypted?.substring(0, 3)}***)`);
						encryptedNames++;
					} catch (error) {
						console.log(`  👤 Name: encrypted ❌ (CORRUPTED - cannot decrypt)`);
						console.log(`      Raw value: ${user.name.substring(0, 50)}...`);
						corruptedNames++;
					}
				} else {
					console.log(`  👤 Name: plain text ⚠️  (${user.name?.substring(0, 3)}***)`);
					plainNames++;
				}
			} else {
				console.log(`  👤 Name: null/empty`);
			}

			// Check phone
			if (user.phone) {
				if (isEncrypted(user.phone)) {
					try {
						const decrypted = decrypt(user.phone);
						console.log(`  📱 Phone: encrypted ✅ (decrypts to: ${decrypted?.substring(0, 3)}***)`);
						encryptedPhones++;
					} catch (error) {
						console.log(`  📱 Phone: encrypted ❌ (CORRUPTED - cannot decrypt)`);
						console.log(`      Raw value: ${user.phone.substring(0, 50)}...`);
						corruptedPhones++;
					}
				} else {
					console.log(`  📱 Phone: plain text ⚠️  (${user.phone?.substring(0, 3)}***)`);
					plainPhones++;
				}
			} else {
				console.log(`  📱 Phone: null/empty`);
			}
		}

		console.log('\n' + '='.repeat(60));
		console.log('📊 ENCRYPTION DIAGNOSIS SUMMARY');
		console.log('='.repeat(60));
		console.log(`Total users: ${totalUsers}\n`);

		console.log('📧 EMAIL STATUS:');
		console.log(`  ✅ Properly encrypted: ${encryptedEmails}`);
		console.log(`  ❌ Corrupted encrypted: ${corruptedEmails}`);
		console.log(`  ⚠️  Plain text: ${plainEmails}\n`);

		console.log('👤 NAME STATUS:');
		console.log(`  ✅ Properly encrypted: ${encryptedNames}`);
		console.log(`  ❌ Corrupted encrypted: ${corruptedNames}`);
		console.log(`  ⚠️  Plain text: ${plainNames}\n`);

		console.log('📱 PHONE STATUS:');
		console.log(`  ✅ Properly encrypted: ${encryptedPhones}`);
		console.log(`  ❌ Corrupted encrypted: ${corruptedPhones}`);
		console.log(`  ⚠️  Plain text: ${plainPhones}\n`);

		const totalCorrupted = corruptedEmails + corruptedNames + corruptedPhones;
		const totalPlain = plainEmails + plainNames + plainPhones;

		if (totalCorrupted > 0) {
			console.log('🚨 CRITICAL ISSUE: Corrupted encrypted data found!');
			console.log('   This indicates an encryption key mismatch.');
			console.log('   The current ENCRYPTION_KEY cannot decrypt some existing data.');
			console.log('   This may have happened if the encryption key was changed.');
		}

		if (totalPlain > 0) {
			console.log('⚠️  WARNING: Plain text data found!');
			console.log('   Some sensitive data is not encrypted.');
		}

		if (totalCorrupted === 0 && totalPlain === 0) {
			console.log('✨ All data is properly encrypted and can be decrypted!');
		}
	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}

	process.exit(0);
}

// Run the script
diagnoseEncryptionIssues();

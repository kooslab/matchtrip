#!/usr/bin/env bun
/**
 * Verify Email Encryption
 *
 * This script verifies that:
 * 1. All emails are encrypted
 * 2. All users have email_hash
 * 3. Encrypted emails can be decrypted correctly
 * 4. Email hash matches the decrypted email
 */

import { config } from 'dotenv';
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { decrypt, isEncrypted } from '../src/lib/server/encryption';
import { hashEmail } from '../src/lib/server/emailHash';

// Load environment variables
config();

async function verifyEmailEncryption() {
	console.log('🔍 Verifying Email Encryption\n');
	console.log('='.repeat(50));

	try {
		const allUsers = await db.select().from(users);
		console.log(`Checking ${allUsers.length} users...\n`);

		let allGood = true;
		let encryptedCount = 0;
		let plainTextCount = 0;
		let hashMatchCount = 0;
		let hashMismatchCount = 0;
		let missingHashCount = 0;
		let decryptionErrors = 0;

		for (const user of allUsers) {
			const issues: string[] = [];

			// Check if email exists
			if (!user.email) {
				console.log(`User ${user.id}: No email`);
				continue;
			}

			// Check if email is encrypted
			if (!isEncrypted(user.email)) {
				issues.push('Email NOT encrypted');
				plainTextCount++;
				allGood = false;
			} else {
				encryptedCount++;

				// Try to decrypt
				try {
					const decryptedEmail = decrypt(user.email);

					if (!decryptedEmail || !decryptedEmail.includes('@')) {
						issues.push('Invalid decrypted email');
						decryptionErrors++;
						allGood = false;
					} else {
						// Check if email_hash exists and matches
						if (!user.emailHash) {
							issues.push('Missing email_hash');
							missingHashCount++;
							allGood = false;
						} else {
							const expectedHash = hashEmail(decryptedEmail);
							if (user.emailHash === expectedHash) {
								hashMatchCount++;
							} else {
								issues.push(
									`Hash mismatch: expected ${expectedHash.substring(0, 8)}..., got ${user.emailHash.substring(0, 8)}...`
								);
								hashMismatchCount++;
								allGood = false;
							}
						}
					}
				} catch (error) {
					issues.push(`Decryption failed: ${error}`);
					decryptionErrors++;
					allGood = false;
				}
			}

			// Report issues for this user
			if (issues.length > 0) {
				console.log(`❌ User ${user.id}:`);
				issues.forEach((issue) => console.log(`   - ${issue}`));
			} else {
				console.log(`✅ User ${user.id}: All checks passed`);
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('Verification Summary:');
		console.log('='.repeat(50));
		console.log(`Total users: ${allUsers.length}`);
		console.log(`Encrypted emails: ${encryptedCount}`);
		console.log(`Plain text emails: ${plainTextCount}`);
		console.log(`Hash matches: ${hashMatchCount}`);
		console.log(`Hash mismatches: ${hashMismatchCount}`);
		console.log(`Missing hashes: ${missingHashCount}`);
		console.log(`Decryption errors: ${decryptionErrors}`);
		console.log('='.repeat(50) + '\n');

		if (allGood) {
			console.log('✅ All verification checks passed!');
			console.log('📋 Email encryption is working correctly.');
			console.log('🔐 OAuth login will use email_hash for lookups.');
		} else {
			console.error('❌ Some verification checks failed!');
			console.error('⚠️  Please review the issues above.');
			process.exit(1);
		}

		// Test OAuth lookup simulation
		console.log('\n' + '='.repeat(50));
		console.log('OAuth Lookup Test:');
		console.log('='.repeat(50));

		// Pick a user to test
		const testUser = allUsers.find((u) => u.email && isEncrypted(u.email));
		if (testUser) {
			const decryptedEmail = decrypt(testUser.email!);
			console.log(`Testing with user: ${testUser.id}`);
			console.log(`Decrypted email: ${decryptedEmail}`);

			// Simulate OAuth lookup by email_hash
			const lookupHash = hashEmail(decryptedEmail!);
			const foundUser = await db.query.users.findFirst({
				where: (users, { eq }) => eq(users.emailHash, lookupHash)
			});

			if (foundUser && foundUser.id === testUser.id) {
				console.log('✅ OAuth lookup by email_hash works!');
			} else {
				console.error('❌ OAuth lookup failed!');
				allGood = false;
			}
		}
	} catch (error) {
		console.error('Fatal error during verification:', error);
		process.exit(1);
	}
}

// Run verification
verifyEmailEncryption();

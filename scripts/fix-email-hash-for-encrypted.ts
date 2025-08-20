#!/usr/bin/env bun
/**
 * Fix Email Hash for Encrypted Emails
 * 
 * This script:
 * 1. Decrypts encrypted email addresses
 * 2. Generates email_hash from the decrypted email
 * 3. Updates the email_hash column
 * 
 * This is needed when emails were encrypted before email_hash was populated.
 */

import { config } from 'dotenv';
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { decrypt, isEncrypted } from '../src/lib/server/encryption';
import { hashEmail } from '../src/lib/server/emailHash';

// Load environment variables
config();

async function fixEmailHashes() {
	console.log('🔧 Fixing email_hash for encrypted emails...\n');
	console.log('='.repeat(50));

	try {
		// Fetch all users
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let fixedCount = 0;
		let alreadyHasHashCount = 0;
		let noEmailCount = 0;
		let notEncryptedCount = 0;
		let errorCount = 0;

		for (const user of allUsers) {
			// Skip if no email
			if (!user.email) {
				noEmailCount++;
				console.log(`User ${user.id}: No email`);
				continue;
			}

			// Check if already has hash
			if (user.emailHash) {
				alreadyHasHashCount++;
				console.log(`User ${user.id}: Already has email_hash`);
				continue;
			}

			// Check if email is encrypted
			if (!isEncrypted(user.email)) {
				// Plain text email - can hash directly
				try {
					const emailHash = hashEmail(user.email);
					await db.update(users)
						.set({ 
							emailHash: emailHash,
							updatedAt: new Date()
						})
						.where(eq(users.id, user.id));
					
					console.log(`✓ User ${user.id}: Hash generated from plain text email`);
					fixedCount++;
				} catch (error) {
					console.error(`✗ User ${user.id}: Failed to generate hash:`, error);
					errorCount++;
				}
				notEncryptedCount++;
			} else {
				// Encrypted email - need to decrypt first
				try {
					const decryptedEmail = decrypt(user.email);
					
					if (!decryptedEmail) {
						throw new Error('Decryption returned null');
					}
					
					if (!decryptedEmail.includes('@')) {
						throw new Error(`Invalid email format: ${decryptedEmail}`);
					}
					
					// Generate hash from decrypted email
					const emailHash = hashEmail(decryptedEmail);
					
					// Update the user with email_hash
					await db.update(users)
						.set({ 
							emailHash: emailHash,
							updatedAt: new Date()
						})
						.where(eq(users.id, user.id));
					
					console.log(`✓ User ${user.id}: Hash generated for ${decryptedEmail.substring(0, 3)}***@***`);
					fixedCount++;
				} catch (error) {
					console.error(`✗ User ${user.id}: Failed to decrypt and hash:`, error);
					errorCount++;
				}
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('Fix Email Hash Summary:');
		console.log('='.repeat(50));
		console.log(`Total users: ${allUsers.length}`);
		console.log(`Email hashes fixed: ${fixedCount}`);
		console.log(`Already had hash: ${alreadyHasHashCount}`);
		console.log(`No email: ${noEmailCount}`);
		console.log(`Plain text emails: ${notEncryptedCount}`);
		console.log(`Errors: ${errorCount}`);
		console.log('='.repeat(50) + '\n');

		if (errorCount > 0) {
			console.error('⚠️  Some users failed to process. Check the errors above.');
			process.exit(1);
		} else if (fixedCount > 0) {
			console.log('✅ Email hashes fixed successfully!');
			console.log('🔐 OAuth login will now work with encrypted emails.');
		} else {
			console.log('ℹ️  No email hashes needed fixing.');
		}

		// Verify all users now have email_hash
		console.log('\n' + '='.repeat(50));
		console.log('Verification:');
		console.log('='.repeat(50));
		
		const usersWithoutHash = await db.query.users.findMany({
			where: (users, { and, isNotNull, isNull }) => 
				and(isNotNull(users.email), isNull(users.emailHash))
		});
		
		if (usersWithoutHash.length === 0) {
			console.log('✅ All users with emails now have email_hash!');
		} else {
			console.error(`❌ Still ${usersWithoutHash.length} users without email_hash`);
			usersWithoutHash.forEach(u => {
				console.error(`  - User ${u.id}`);
			});
		}

	} catch (error) {
		console.error('Fatal error:', error);
		process.exit(1);
	}
}

// Dry run mode
async function dryRun() {
	console.log('DRY RUN MODE - No changes will be made\n');
	console.log('='.repeat(50));

	try {
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let needsFixCount = 0;
		let alreadyHasHashCount = 0;
		let noEmailCount = 0;
		let encryptedWithoutHashCount = 0;
		let plainTextWithoutHashCount = 0;

		for (const user of allUsers) {
			if (!user.email) {
				noEmailCount++;
				console.log(`User ${user.id}: No email`);
			} else if (user.emailHash) {
				alreadyHasHashCount++;
				console.log(`User ${user.id}: Already has email_hash`);
			} else {
				needsFixCount++;
				if (isEncrypted(user.email)) {
					encryptedWithoutHashCount++;
					try {
						const decrypted = decrypt(user.email);
						console.log(`User ${user.id}: Would generate hash for encrypted email: ${decrypted?.substring(0, 3)}***`);
					} catch (error) {
						console.log(`User ${user.id}: ❌ Cannot decrypt email to generate hash`);
					}
				} else {
					plainTextWithoutHashCount++;
					console.log(`User ${user.id}: Would generate hash for plain text email: ${user.email.substring(0, 3)}***`);
				}
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('DRY RUN Summary:');
		console.log('='.repeat(50));
		console.log(`Total users: ${allUsers.length}`);
		console.log(`Needs email_hash: ${needsFixCount}`);
		console.log(`  - Encrypted without hash: ${encryptedWithoutHashCount}`);
		console.log(`  - Plain text without hash: ${plainTextWithoutHashCount}`);
		console.log(`Already has hash: ${alreadyHasHashCount}`);
		console.log(`No email: ${noEmailCount}`);
		console.log('='.repeat(50) + '\n');

	} catch (error) {
		console.error('Error during dry run:', error);
		process.exit(1);
	}
}

// Main execution
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
	dryRun();
} else {
	console.log('⚠️  WARNING: This will generate email_hash for all users.');
	console.log('This is required for OAuth login to work with encrypted emails.');
	console.log('\nRun with --dry-run flag to preview changes.\n');
	console.log('Starting in 3 seconds... Press Ctrl+C to cancel.\n');
	
	setTimeout(() => {
		fixEmailHashes();
	}, 3000);
}
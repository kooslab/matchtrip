#!/usr/bin/env bun
import { config } from 'dotenv';
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { encrypt, isEncrypted } from '../src/lib/server/encryption';
import { hashEmail } from '../src/lib/server/emailHash';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

/**
 * Script to encrypt email column while maintaining email_hash for lookups
 * Run with: bun run scripts/encrypt-emails.ts
 */

async function encryptEmails() {
	console.log('Starting email encryption...\n');
	console.log('='.repeat(50));
	console.log('⚠️  This will encrypt all email addresses in the database');
	console.log('✅  Email hashes will be preserved for lookups');
	console.log('='.repeat(50) + '\n');

	try {
		// Fetch all users
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let encryptedCount = 0;
		let alreadyEncryptedCount = 0;
		let hashUpdatedCount = 0;
		let errorCount = 0;

		for (const user of allUsers) {
			console.log(`\nProcessing user ${user.id}:`);

			let needsUpdate = false;
			const updates: Partial<typeof users.$inferSelect> = {};

			// Check and encrypt email
			if (user.email && !isEncrypted(user.email)) {
				console.log(`  - Encrypting email: ${user.email.substring(0, 3)}***@***`);
				updates.email = encrypt(user.email);
				needsUpdate = true;
				encryptedCount++;
			} else if (user.email && isEncrypted(user.email)) {
				console.log(`  - Email already encrypted`);
				alreadyEncryptedCount++;
			}

			// Ensure email hash exists (in case some users don't have it yet)
			if (user.email && !user.emailHash) {
				// If email is already encrypted, we can't generate hash
				if (isEncrypted(user.email)) {
					console.log(`  ⚠️  Cannot generate hash for already encrypted email`);
					errorCount++;
				} else {
					console.log(`  - Generating email hash`);
					updates.emailHash = hashEmail(user.email);
					hashUpdatedCount++;
					needsUpdate = true;
				}
			}

			// Update the user if any fields need changes
			if (needsUpdate) {
				try {
					await db.update(users).set(updates).where(eq(users.id, user.id));
					console.log(`  ✓ User ${user.id} updated successfully`);
				} catch (error) {
					console.error(`  ✗ Failed to update user ${user.id}:`, error);
					errorCount++;
				}
			} else {
				console.log(`  - No updates needed for user ${user.id}`);
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('Email Encryption Summary:');
		console.log('='.repeat(50));
		console.log(`Total users processed: ${allUsers.length}`);
		console.log(`Emails encrypted: ${encryptedCount}`);
		console.log(`Already encrypted: ${alreadyEncryptedCount}`);
		console.log(`Email hashes added: ${hashUpdatedCount}`);
		console.log(`Errors: ${errorCount}`);
		console.log('='.repeat(50) + '\n');

		if (errorCount > 0) {
			console.error('⚠️  Some users failed to update. Check the errors above.');
			console.error(
				'⚠️  If emails were already encrypted without hashes, manual intervention may be needed.'
			);
			process.exit(1);
		} else {
			console.log('✅ Email encryption completed successfully!');
			console.log('ℹ️  Email hashes are preserved for authentication and lookups.');
		}
	} catch (error) {
		console.error('Fatal error during email encryption:', error);
		process.exit(1);
	}
}

// Dry run mode to preview what would be encrypted
async function dryRun() {
	console.log('DRY RUN MODE - No changes will be made\n');
	console.log('='.repeat(50));

	try {
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let wouldEncrypt = 0;
		let alreadyEncrypted = 0;
		let missingHash = 0;
		let encryptedWithoutHash = 0;

		for (const user of allUsers) {
			let needsEncryption = false;

			if (user.email && !isEncrypted(user.email)) {
				console.log(`User ${user.id} - email needs encryption: ${user.email.substring(0, 3)}***`);
				needsEncryption = true;
				wouldEncrypt++;
			} else if (user.email && isEncrypted(user.email)) {
				alreadyEncrypted++;
			}

			if (!user.emailHash) {
				if (user.email && isEncrypted(user.email)) {
					console.log(
						`User ${user.id} - ⚠️  Email is encrypted but hash is missing (cannot generate)`
					);
					encryptedWithoutHash++;
				} else {
					console.log(`User ${user.id} - email hash missing (will be generated)`);
					missingHash++;
				}
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('DRY RUN Summary:');
		console.log('='.repeat(50));
		console.log(`Total users: ${allUsers.length}`);
		console.log(`Would encrypt: ${wouldEncrypt}`);
		console.log(`Already encrypted: ${alreadyEncrypted}`);
		console.log(`Missing email hash: ${missingHash}`);
		console.log(`⚠️  Encrypted without hash (problematic): ${encryptedWithoutHash}`);
		console.log('='.repeat(50) + '\n');

		if (encryptedWithoutHash > 0) {
			console.error('⚠️  WARNING: Some emails are already encrypted without hashes.');
			console.error('   These users may have authentication issues after encryption.');
		}
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
	console.log('⚠️  WARNING: This will encrypt all email addresses in the database.');
	console.log('Make sure you have:');
	console.log('  1. Run the migration to add email_hash column');
	console.log('  2. Populated email_hash for all users');
	console.log('  3. Updated authentication to use email_hash for lookups');
	console.log('  4. Backed up your database');
	console.log('\nRun with --dry-run flag to preview changes.\n');
	console.log('Starting in 5 seconds... Press Ctrl+C to cancel.\n');

	setTimeout(() => {
		encryptEmails();
	}, 5000);
}

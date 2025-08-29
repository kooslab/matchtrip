#!/usr/bin/env bun
import { config } from 'dotenv';
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createDecipheriv } from 'crypto';
import { encrypt } from '../src/lib/server/encryption';

// Load environment variables
config();

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTED_PREFIX = 'encrypted:';
const OLD_ENCRYPTED_PREFIX = 'ENC:';

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) {
		throw new Error('ENCRYPTION_KEY environment variable is not set');
	}

	// Convert base64 key to buffer
	const keyBuffer = Buffer.from(key, 'base64');

	// Ensure key is 32 bytes for AES-256
	if (keyBuffer.length !== 32) {
		throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (256 bits)');
	}

	return keyBuffer;
}

/**
 * Decrypt the outer layer (encrypted: prefix) to check if it's double encrypted
 */
function decryptOuterLayer(encryptedData: string): string {
	if (!encryptedData || !encryptedData.startsWith(ENCRYPTED_PREFIX)) {
		return encryptedData;
	}

	try {
		// Remove prefix and split parts
		const withoutPrefix = encryptedData.slice(ENCRYPTED_PREFIX.length);
		const parts = withoutPrefix.split(':');

		if (parts.length !== 3) {
			throw new Error('Invalid encrypted data format');
		}

		const [ivBase64, authTagBase64, encryptedBase64] = parts;

		const key = getEncryptionKey();
		const iv = Buffer.from(ivBase64, 'base64');
		const authTag = Buffer.from(authTagBase64, 'base64');
		const encrypted = Buffer.from(encryptedBase64, 'base64');

		const decipher = createDecipheriv(ALGORITHM, key, iv);
		decipher.setAuthTag(authTag);

		const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

		return decrypted.toString('utf8');
	} catch (error) {
		console.error('Failed to decrypt outer layer:', error);
		throw error;
	}
}

/**
 * Generate a default name from email
 */
function generateNameFromEmail(email: string): string {
	// Get the part before @
	const emailPrefix = email.split('@')[0];

	// Remove numbers and special characters, capitalize first letter
	const cleanName = emailPrefix
		.replace(/[0-9]/g, '') // Remove numbers
		.replace(/[._-]/g, ' ') // Replace common separators with space
		.replace(/\s+/g, ' ') // Normalize spaces
		.trim();

	if (cleanName.length > 0) {
		// Capitalize first letter of each word
		return cleanName
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');
	}

	// Fallback to "User" if we can't extract a reasonable name
	return 'User';
}

/**
 * Reset double-encrypted names
 */
async function resetDoubleEncryptedNames() {
	console.log('Starting to reset double-encrypted names...\n');
	console.log('='.repeat(50));

	try {
		// Fetch all users
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let resetCount = 0;
		let alreadyOkCount = 0;
		let errorCount = 0;

		for (const user of allUsers) {
			// Check if name is double encrypted
			if (user.name && user.name.startsWith(ENCRYPTED_PREFIX)) {
				try {
					const firstDecrypt = decryptOuterLayer(user.name);

					if (firstDecrypt.startsWith(OLD_ENCRYPTED_PREFIX)) {
						// Double encrypted! Reset it
						console.log(`User ${user.id}:`);
						console.log(`  Email: ${user.email}`);

						// Generate a new name from email
						const newName = generateNameFromEmail(user.email);
						console.log(`  New name: ${newName}`);

						// Encrypt the new name with current method
						const encryptedName = encrypt(newName);

						// Update the user
						await db
							.update(users)
							.set({
								name: encryptedName,
								updatedAt: new Date()
							})
							.where(eq(users.id, user.id));

						console.log(`  ✓ Name reset successfully\n`);
						resetCount++;
					} else {
						// Properly encrypted, no need to reset
						alreadyOkCount++;
					}
				} catch (error) {
					console.error(`Failed to process user ${user.id}:`, error);
					errorCount++;
				}
			} else if (!user.name) {
				// User has no name, set a default
				console.log(`User ${user.id}: No name set`);
				const newName = generateNameFromEmail(user.email);
				console.log(`  Setting name to: ${newName}`);

				const encryptedName = encrypt(newName);

				await db
					.update(users)
					.set({
						name: encryptedName,
						updatedAt: new Date()
					})
					.where(eq(users.id, user.id));

				console.log(`  ✓ Name set successfully\n`);
				resetCount++;
			}

			// Check phone field too
			if (user.phone && user.phone.startsWith(ENCRYPTED_PREFIX)) {
				try {
					const firstDecrypt = decryptOuterLayer(user.phone);

					if (firstDecrypt.startsWith(OLD_ENCRYPTED_PREFIX)) {
						// Double encrypted phone - just remove it
						console.log(`User ${user.id}: Double encrypted phone detected`);
						console.log(`  Removing phone number (user can re-add it later)`);

						await db
							.update(users)
							.set({
								phone: null,
								phoneVerified: false,
								updatedAt: new Date()
							})
							.where(eq(users.id, user.id));

						console.log(`  ✓ Phone removed\n`);
					}
				} catch (error) {
					console.error(`Failed to process phone for user ${user.id}:`, error);
				}
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('Reset Summary:');
		console.log('='.repeat(50));
		console.log(`Total users processed: ${allUsers.length}`);
		console.log(`Names reset: ${resetCount}`);
		console.log(`Already properly encrypted: ${alreadyOkCount}`);
		console.log(`Errors: ${errorCount}`);
		console.log('='.repeat(50) + '\n');

		if (errorCount > 0) {
			console.error('⚠️  Some users failed to process. Check the errors above.');
			process.exit(1);
		} else {
			console.log('✅ Double-encrypted names reset successfully!');
			console.log(
				'\n📝 Note: Users should be notified to update their profiles with their preferred names.'
			);
		}
	} catch (error) {
		console.error('Fatal error during reset:', error);
		process.exit(1);
	}
}

// Dry run mode to preview what would be reset
async function dryRun() {
	console.log('DRY RUN MODE - No changes will be made\n');
	console.log('='.repeat(50));

	try {
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let doubleEncryptedCount = 0;
		let properlyEncryptedCount = 0;
		let noNameCount = 0;
		let doubleEncryptedPhoneCount = 0;

		for (const user of allUsers) {
			// Check name
			if (user.name && user.name.startsWith(ENCRYPTED_PREFIX)) {
				try {
					const firstDecrypt = decryptOuterLayer(user.name);

					if (firstDecrypt.startsWith(OLD_ENCRYPTED_PREFIX)) {
						doubleEncryptedCount++;
						console.log(`User ${user.id}: Double encrypted name`);
						console.log(`  Email: ${user.email}`);
						console.log(`  Would reset to: ${generateNameFromEmail(user.email)}`);
						console.log('');
					} else {
						properlyEncryptedCount++;
					}
				} catch (error) {
					console.error(`Error checking user ${user.id}:`, error);
				}
			} else if (!user.name) {
				noNameCount++;
				console.log(`User ${user.id}: No name`);
				console.log(`  Email: ${user.email}`);
				console.log(`  Would set to: ${generateNameFromEmail(user.email)}`);
				console.log('');
			}

			// Check phone
			if (user.phone && user.phone.startsWith(ENCRYPTED_PREFIX)) {
				try {
					const firstDecrypt = decryptOuterLayer(user.phone);

					if (firstDecrypt.startsWith(OLD_ENCRYPTED_PREFIX)) {
						doubleEncryptedPhoneCount++;
						console.log(`User ${user.id}: Double encrypted phone (would be removed)`);
					}
				} catch (error) {
					// Ignore phone errors in dry run
				}
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('DRY RUN Summary:');
		console.log('='.repeat(50));
		console.log(`Total users: ${allUsers.length}`);
		console.log(`Double encrypted names to reset: ${doubleEncryptedCount}`);
		console.log(`No name (will set default): ${noNameCount}`);
		console.log(`Double encrypted phones to remove: ${doubleEncryptedPhoneCount}`);
		console.log(`Properly encrypted (no changes): ${properlyEncryptedCount}`);
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
	console.log('⚠️  WARNING: This will reset double-encrypted names to default values.');
	console.log('Names will be generated from email addresses.');
	console.log('Double-encrypted phone numbers will be removed.');
	console.log('Users should be notified to update their profiles.');
	console.log('\nRun with --dry-run flag to preview changes.\n');
	console.log('Starting in 5 seconds... Press Ctrl+C to cancel.\n');

	setTimeout(() => {
		resetDoubleEncryptedNames();
	}, 5000);
}

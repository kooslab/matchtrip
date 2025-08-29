#!/usr/bin/env bun
import { db } from '../src/lib/server/db';
import { users } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createDecipheriv, createCipheriv, randomBytes } from 'crypto';

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
 * Encrypt using the current method (for re-encryption)
 */
function encrypt(plainText: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(16);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

	const authTag = cipher.getAuthTag();

	// Combine all parts with colon separator
	const combined = `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;

	return combined;
}

/**
 * Decrypt the outer layer (encrypted: prefix)
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
 * Try different decryption methods for the inner layer (ENC: prefix)
 * The old system might have used different encoding
 */
function tryDecryptInnerLayer(encryptedData: string): string | null {
	if (!encryptedData || !encryptedData.startsWith(OLD_ENCRYPTED_PREFIX)) {
		return encryptedData;
	}

	// Remove ENC: prefix and split parts
	const withoutPrefix = encryptedData.slice(OLD_ENCRYPTED_PREFIX.length);
	const parts = withoutPrefix.split(':');

	if (parts.length !== 3) {
		console.error('Invalid old encrypted format');
		return null;
	}

	const [ivBase64, authTagBase64, encryptedBase64] = parts;
	const key = getEncryptionKey();

	// Try different decoding methods
	const attempts = [
		// Method 1: Standard base64
		() => {
			const iv = Buffer.from(ivBase64, 'base64');
			const authTag = Buffer.from(authTagBase64, 'base64');
			const encrypted = Buffer.from(encryptedBase64, 'base64');
			return { iv, authTag, encrypted };
		},
		// Method 2: URL-safe base64
		() => {
			const iv = Buffer.from(ivBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
			const authTag = Buffer.from(authTagBase64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
			const encrypted = Buffer.from(
				encryptedBase64.replace(/-/g, '+').replace(/_/g, '/'),
				'base64'
			);
			return { iv, authTag, encrypted };
		},
		// Method 3: Hex encoding
		() => {
			try {
				const iv = Buffer.from(ivBase64, 'hex');
				const authTag = Buffer.from(authTagBase64, 'hex');
				const encrypted = Buffer.from(encryptedBase64, 'hex');
				return { iv, authTag, encrypted };
			} catch {
				return null;
			}
		}
	];

	for (let i = 0; i < attempts.length; i++) {
		try {
			const buffers = attempts[i]();
			if (!buffers) continue;

			const { iv, authTag, encrypted } = buffers;

			const decipher = createDecipheriv(ALGORITHM, key, iv);
			decipher.setAuthTag(authTag);

			const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

			const result = decrypted.toString('utf8');
			console.log(`  Method ${i + 1} succeeded: ${result}`);
			return result;
		} catch (error) {
			// This method didn't work, try next
		}
	}

	return null;
}

/**
 * Fix double-encrypted data
 */
async function fixDoubleEncryption() {
	console.log('Starting to fix double encryption...\n');
	console.log('='.repeat(50));

	try {
		// Fetch all users
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let fixedCount = 0;
		let alreadyFixedCount = 0;
		let errorCount = 0;
		let reEncryptedCount = 0;

		for (const user of allUsers) {
			let needsUpdate = false;
			const updates: any = {};

			// Check name
			if (user.name && user.name.startsWith(ENCRYPTED_PREFIX)) {
				try {
					const firstDecrypt = decryptOuterLayer(user.name);

					if (firstDecrypt.startsWith(OLD_ENCRYPTED_PREFIX)) {
						// Double encrypted! Try to fully decrypt
						console.log(`User ${user.id}: Double encryption detected in name`);
						const fullyDecrypted = tryDecryptInnerLayer(firstDecrypt);

						if (fullyDecrypted) {
							// Successfully decrypted! Re-encrypt with current method
							console.log(`  -> Fully decrypted name: ${fullyDecrypted}`);
							console.log(`  -> Re-encrypting with current method...`);
							updates.name = encrypt(fullyDecrypted);
							needsUpdate = true;
							reEncryptedCount++;
						} else {
							// Can't decrypt inner layer, just remove outer layer
							console.log(`  -> Cannot decrypt inner layer, removing outer layer only`);
							updates.name = firstDecrypt;
							needsUpdate = true;
							fixedCount++;
						}
					} else {
						// Already fixed or properly encrypted
						alreadyFixedCount++;
					}
				} catch (error) {
					console.error(`Failed to process name for user ${user.id}:`, error);
					errorCount++;
				}
			}

			// Check phone
			if (user.phone && user.phone.startsWith(ENCRYPTED_PREFIX)) {
				try {
					const firstDecrypt = decryptOuterLayer(user.phone);

					if (firstDecrypt.startsWith(OLD_ENCRYPTED_PREFIX)) {
						// Double encrypted! Try to fully decrypt
						console.log(`User ${user.id}: Double encryption detected in phone`);
						const fullyDecrypted = tryDecryptInnerLayer(firstDecrypt);

						if (fullyDecrypted) {
							// Successfully decrypted! Re-encrypt with current method
							console.log(`  -> Fully decrypted phone: ${fullyDecrypted}`);
							console.log(`  -> Re-encrypting with current method...`);
							updates.phone = encrypt(fullyDecrypted);
							needsUpdate = true;
						} else {
							// Can't decrypt inner layer, just remove outer layer
							console.log(`  -> Cannot decrypt inner layer, removing outer layer only`);
							updates.phone = firstDecrypt;
							needsUpdate = true;
						}
					}
				} catch (error) {
					console.error(`Failed to process phone for user ${user.id}:`, error);
					errorCount++;
				}
			}

			// Update the user if needed
			if (needsUpdate) {
				try {
					await db.update(users).set(updates).where(eq(users.id, user.id));
					console.log(`✓ User ${user.id} fixed successfully\n`);
				} catch (error) {
					console.error(`✗ Failed to update user ${user.id}:`, error);
					errorCount++;
				}
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('Fix Double Encryption Summary:');
		console.log('='.repeat(50));
		console.log(`Total users processed: ${allUsers.length}`);
		console.log(`Users re-encrypted properly: ${reEncryptedCount}`);
		console.log(`Users with outer layer removed: ${fixedCount}`);
		console.log(`Already fixed/properly encrypted: ${alreadyFixedCount}`);
		console.log(`Errors: ${errorCount}`);
		console.log('='.repeat(50) + '\n');

		if (errorCount > 0) {
			console.error('⚠️  Some users failed to process. Check the errors above.');
			process.exit(1);
		} else {
			console.log('✅ Double encryption fix completed successfully!');
		}
	} catch (error) {
		console.error('Fatal error during fix:', error);
		process.exit(1);
	}
}

// Dry run mode to preview what would be fixed
async function dryRun() {
	console.log('DRY RUN MODE - No changes will be made\n');
	console.log('='.repeat(50));

	try {
		const allUsers = await db.select().from(users);
		console.log(`Found ${allUsers.length} users to check\n`);

		let doubleEncryptedCount = 0;
		let canFullyDecrypt = 0;
		let cannotFullyDecrypt = 0;
		let properlyEncryptedCount = 0;

		for (const user of allUsers) {
			// Check name
			if (user.name && user.name.startsWith(ENCRYPTED_PREFIX)) {
				try {
					const firstDecrypt = decryptOuterLayer(user.name);

					if (firstDecrypt.startsWith(OLD_ENCRYPTED_PREFIX)) {
						doubleEncryptedCount++;
						console.log(`User ${user.id}: Double encrypted name`);
						console.log(`  Current: ${user.name.substring(0, 50)}...`);
						console.log(`  After outer decrypt: ${firstDecrypt.substring(0, 50)}...`);

						const fullyDecrypted = tryDecryptInnerLayer(firstDecrypt);
						if (fullyDecrypted) {
							console.log(`  ✓ Can fully decrypt: ${fullyDecrypted}`);
							canFullyDecrypt++;
						} else {
							console.log(`  ✗ Cannot decrypt inner layer (will remove outer layer only)`);
							cannotFullyDecrypt++;
						}
						console.log('');
					} else {
						properlyEncryptedCount++;
					}
				} catch (error) {
					console.error(`Error checking user ${user.id}:`, error);
				}
			}
		}

		console.log('\n' + '='.repeat(50));
		console.log('DRY RUN Summary:');
		console.log('='.repeat(50));
		console.log(`Total users: ${allUsers.length}`);
		console.log(`Double encrypted: ${doubleEncryptedCount}`);
		console.log(`Can fully decrypt and re-encrypt: ${canFullyDecrypt}`);
		console.log(`Cannot decrypt inner layer: ${cannotFullyDecrypt}`);
		console.log(`Properly encrypted: ${properlyEncryptedCount}`);
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
	console.log('⚠️  WARNING: This will fix double-encrypted data in the database.');
	console.log('Data that can be fully decrypted will be re-encrypted properly.');
	console.log('Data that cannot be decrypted will have the outer layer removed.');
	console.log('Run with --dry-run flag to preview changes.\n');
	console.log('Starting in 5 seconds... Press Ctrl+C to cancel.\n');

	setTimeout(() => {
		fixDoubleEncryption();
	}, 5000);
}

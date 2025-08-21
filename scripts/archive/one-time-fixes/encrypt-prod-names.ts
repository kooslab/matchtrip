#!/usr/bin/env bun

/**
 * Independent script to encrypt unencrypted names in production database
 * This script uses .env.prod for configuration
 * Run with --dry-run flag to preview changes without applying them
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, text, boolean, timestamp, date, pgEnum } from 'drizzle-orm/pg-core';
import { eq, sql } from 'drizzle-orm';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { resolve } from 'path';

// Load .env.prod configuration
const envPath = resolve(process.cwd(), '.env.prod');
console.log(`Loading environment from: ${envPath}`);
// Force override any existing env variables
config({ path: envPath, override: true });

// Encryption configuration (copied from main app to be independent)
const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const ENCRYPTED_PREFIX = 'encrypted:';

// Define the users table schema (minimal schema needed for this script)
const roleEnum = pgEnum('role', ['traveler', 'guide', 'admin']);

const users = pgTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	name: text('name'),
	phone: text('phone'),
	updatedAt: timestamp('updated_at')
});

// Encryption functions (copied to be independent)
function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) {
		throw new Error('ENCRYPTION_KEY environment variable is not set');
	}
	// Convert base64 key to buffer (same as main app)
	const keyBuffer = Buffer.from(key, 'base64');
	
	// Ensure key is 32 bytes for AES-256
	if (keyBuffer.length !== 32) {
		throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (256 bits)');
	}
	
	return keyBuffer;
}

function isEncrypted(data: string | null | undefined): boolean {
	if (!data) return false;
	return data.startsWith(ENCRYPTED_PREFIX);
}

function encrypt(data: string | null | undefined): string | null {
	if (!data) return data as any;
	
	// Already encrypted
	if (isEncrypted(data)) {
		return data;
	}

	try {
		const key = getEncryptionKey();
		const iv = randomBytes(IV_LENGTH);
		const cipher = createCipheriv(ALGORITHM, key, iv);
		
		const encrypted = Buffer.concat([
			cipher.update(data, 'utf8'),
			cipher.final()
		]);
		
		const authTag = cipher.getAuthTag();
		
		// Combine IV, auth tag, and encrypted data
		const combined = `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
		
		return combined;
	} catch (error) {
		console.error('Encryption error:', error);
		throw new Error('Failed to encrypt data');
	}
}

function decrypt(encryptedData: string | null | undefined): string | null {
	if (!encryptedData) return encryptedData as any;
	
	// Check if data is encrypted
	if (!isEncrypted(encryptedData)) {
		// Return as-is if not encrypted
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

		const decrypted = Buffer.concat([
			decipher.update(encrypted),
			decipher.final()
		]);

		return decrypted.toString('utf8');
	} catch (error) {
		console.error('Decryption error:', error);
		throw new Error('Failed to decrypt data');
	}
}

// Main script
async function main() {
	const isDryRun = process.argv.includes('--dry-run');
	
	console.log('\n' + '='.repeat(60));
	console.log('🔐 PRODUCTION NAME ENCRYPTION SCRIPT');
	console.log('='.repeat(60));
	
	// Verify environment
	if (!process.env.DATABASE_URL) {
		console.error('❌ DATABASE_URL not found in .env.prod');
		process.exit(1);
	}
	
	if (!process.env.ENCRYPTION_KEY) {
		console.error('❌ ENCRYPTION_KEY not found in .env.prod');
		process.exit(1);
	}
	
	console.log(`📦 Database: ${process.env.DATABASE_URL.substring(0, 40)}...`);
	console.log(`🔑 Encryption key: ${process.env.ENCRYPTION_KEY.substring(0, 10)}...`);
	console.log(`🏃 Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'LIVE (will update database)'}`);
	console.log('='.repeat(60) + '\n');
	
	if (!isDryRun) {
		console.log('⚠️  WARNING: This will modify the PRODUCTION database!');
		console.log('⚠️  Make sure you have a backup before proceeding.');
		console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');
		await new Promise(resolve => setTimeout(resolve, 5000));
	}
	
	// Create database connection
	const connection = postgres(process.env.DATABASE_URL, {
		ssl: 'require',
		max: 1
	});
	const db = drizzle(connection);
	
	try {
		// Test encryption key
		console.log('🔑 Testing encryption key...');
		const testText = 'test';
		const encrypted = encrypt(testText);
		const decrypted = decrypt(encrypted);
		if (decrypted !== testText) {
			throw new Error('Encryption key test failed!');
		}
		console.log('✅ Encryption key is valid\n');
		
		// Fetch all users
		console.log('📊 Fetching users from database...');
		const allUsers = await db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				phone: users.phone
			})
			.from(users);
		
		console.log(`Found ${allUsers.length} total users\n`);
		
		let unencryptedNames: any[] = [];
		let unencryptedPhones: any[] = [];
		let alreadyEncryptedCount = 0;
		
		// Analyze users
		for (const user of allUsers) {
			let hasUnencryptedData = false;
			
			// Check name
			if (user.name) {
				if (!isEncrypted(user.name)) {
					unencryptedNames.push({
						id: user.id,
						email: user.email,
						name: user.name
					});
					hasUnencryptedData = true;
				} else {
					alreadyEncryptedCount++;
				}
			}
			
			// Check phone
			if (user.phone) {
				if (!isEncrypted(user.phone)) {
					unencryptedPhones.push({
						id: user.id,
						email: user.email,
						phone: user.phone
					});
					hasUnencryptedData = true;
				}
			}
		}
		
		// Report findings
		console.log('📋 Analysis Results:');
		console.log(`   • Unencrypted names: ${unencryptedNames.length}`);
		console.log(`   • Unencrypted phones: ${unencryptedPhones.length}`);
		console.log(`   • Already encrypted: ${alreadyEncryptedCount}`);
		console.log('');
		
		if (unencryptedNames.length === 0 && unencryptedPhones.length === 0) {
			console.log('✅ All data is already encrypted! Nothing to do.');
			await connection.end();
			process.exit(0);
		}
		
		// Show preview of changes
		if (unencryptedNames.length > 0) {
			console.log('📝 Names to encrypt:');
			for (const user of unencryptedNames.slice(0, 5)) {
				console.log(`   ${user.id} (${user.email}): "${user.name}"`);
			}
			if (unencryptedNames.length > 5) {
				console.log(`   ... and ${unencryptedNames.length - 5} more`);
			}
			console.log('');
		}
		
		if (unencryptedPhones.length > 0) {
			console.log('📱 Phones to encrypt:');
			for (const user of unencryptedPhones.slice(0, 5)) {
				console.log(`   ${user.id} (${user.email}): "${user.phone}"`);
			}
			if (unencryptedPhones.length > 5) {
				console.log(`   ... and ${unencryptedPhones.length - 5} more`);
			}
			console.log('');
		}
		
		if (isDryRun) {
			console.log('✅ DRY RUN COMPLETE - No changes were made');
			console.log('Remove --dry-run flag to apply changes');
		} else {
			console.log('🔄 Starting encryption process...\n');
			
			let successCount = 0;
			let errorCount = 0;
			
			// Process each user that needs updates
			const usersToUpdate = new Map();
			
			// Collect all updates needed per user
			for (const user of unencryptedNames) {
				if (!usersToUpdate.has(user.id)) {
					usersToUpdate.set(user.id, { updates: {}, email: user.email });
				}
				usersToUpdate.get(user.id).updates.name = encrypt(user.name);
			}
			
			for (const user of unencryptedPhones) {
				if (!usersToUpdate.has(user.id)) {
					usersToUpdate.set(user.id, { updates: {}, email: user.email });
				}
				usersToUpdate.get(user.id).updates.phone = encrypt(user.phone);
			}
			
			// Apply updates
			for (const [userId, data] of usersToUpdate) {
				try {
					await db
						.update(users)
						.set({
							...data.updates,
							updatedAt: new Date()
						})
						.where(eq(users.id, userId));
					
					successCount++;
					console.log(`✅ Updated user ${userId} (${data.email})`);
				} catch (error) {
					errorCount++;
					console.error(`❌ Failed to update user ${userId} (${data.email}):`, error);
				}
			}
			
			console.log('\n' + '='.repeat(60));
			console.log('📈 FINAL RESULTS');
			console.log('='.repeat(60));
			console.log(`✅ Successfully updated: ${successCount} users`);
			console.log(`❌ Failed updates: ${errorCount} users`);
			console.log('='.repeat(60));
			
			if (errorCount > 0) {
				console.log('\n⚠️  Some updates failed. Please check the errors above.');
				process.exit(1);
			} else {
				console.log('\n🎉 All updates completed successfully!');
			}
		}
		
	} catch (error) {
		console.error('\n❌ Fatal error:', error);
		process.exit(1);
	} finally {
		// Close database connection
		await connection.end();
	}
}

// Run the script
main().catch(error => {
	console.error('Unhandled error:', error);
	process.exit(1);
});
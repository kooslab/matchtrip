#!/usr/bin/env bun
/**
 * Script to decrypt encrypted emails in dev database
 * Emails should be plaintext for authentication to work properly
 * This script will decrypt any encrypted emails (those starting with 'ENC:')
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import { createDecipheriv, scryptSync } from 'crypto';
import { resolve } from 'path';

// Load .env configuration for dev database
const envPath = resolve(process.cwd(), '.env');
console.log(`Loading environment from: ${envPath}`);
// Force override any existing env variables
config({ path: envPath, override: true });

// Encryption configuration (same as main app)
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTED_PREFIX = 'encrypted:';

// Define minimal users table schema
const users = pgTable('users', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	name: text('name'),
	phone: text('phone'),
	updatedAt: timestamp('updated_at')
});

// Decryption function
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
		return null;
	}
}

// Main script
async function main() {
	const isDryRun = process.argv.includes('--dry-run');
	
	console.log('\n' + '='.repeat(60));
	console.log('📧 DEV DATABASE EMAIL DECRYPTION SCRIPT');
	console.log('='.repeat(60));
	
	// Verify environment
	if (!process.env.DATABASE_URL) {
		console.error('❌ DATABASE_URL not found in .env');
		process.exit(1);
	}
	
	if (!process.env.ENCRYPTION_KEY) {
		console.error('❌ ENCRYPTION_KEY not found in .env');
		process.exit(1);
	}
	
	console.log(`📦 Database: ${process.env.DATABASE_URL.substring(0, 40)}...`);
	console.log(`🔑 Encryption key: ${process.env.ENCRYPTION_KEY.substring(0, 10)}...`);
	console.log(`🏃 Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'LIVE (will update database)'}`);
	console.log('='.repeat(60) + '\n');
	
	if (!isDryRun) {
		console.log('⚠️  WARNING: This will modify the DEV database!');
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
		// Test decryption with a sample
		console.log('🔑 Testing decryption key...');
		// We'll test with actual data from the database
		
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
		
		let encryptedEmails: any[] = [];
		let plainEmails: any[] = [];
		let decryptionErrors: any[] = [];
		
		// Analyze users
		for (const user of allUsers) {
			// Check email
			if (user.email) {
				if (isEncrypted(user.email)) {
					const decrypted = decrypt(user.email);
					if (decrypted) {
						encryptedEmails.push({
							id: user.id,
							email: user.email,
							decryptedEmail: decrypted
						});
					} else {
						decryptionErrors.push({
							id: user.id,
							email: user.email
						});
					}
				} else {
					plainEmails.push({
						id: user.id,
						email: user.email
					});
				}
			}
		}
		
		// Report findings
		console.log('📋 Analysis Results:');
		console.log(`   • Encrypted emails to decrypt: ${encryptedEmails.length}`);
		console.log(`   • Already plaintext emails: ${plainEmails.length}`);
		console.log(`   • Decryption errors: ${decryptionErrors.length}`);
		console.log('');
		
		if (encryptedEmails.length === 0) {
			console.log('✅ All emails are already plaintext! Nothing to do.');
			await connection.end();
			process.exit(0);
		}
		
		// Show preview of changes
		console.log('📝 Emails to decrypt:');
		for (const user of encryptedEmails.slice(0, 5)) {
			console.log(`   ${user.id}: "${user.email.substring(0, 20)}..." → "${user.decryptedEmail}"`);
		}
		if (encryptedEmails.length > 5) {
			console.log(`   ... and ${encryptedEmails.length - 5} more`);
		}
		console.log('');
		
		if (decryptionErrors.length > 0) {
			console.log('⚠️  Failed to decrypt:');
			for (const user of decryptionErrors.slice(0, 5)) {
				console.log(`   ${user.id}: "${user.email.substring(0, 20)}..."`);
			}
			if (decryptionErrors.length > 5) {
				console.log(`   ... and ${decryptionErrors.length - 5} more`);
			}
			console.log('');
		}
		
		if (isDryRun) {
			console.log('✅ DRY RUN COMPLETE - No changes were made');
			console.log('Remove --dry-run flag to apply changes');
		} else {
			console.log('🔄 Starting decryption process...\n');
			
			let successCount = 0;
			let errorCount = 0;
			
			// Process each user that needs email decryption
			for (const user of encryptedEmails) {
				try {
					await db
						.update(users)
						.set({
							email: user.decryptedEmail,
							updatedAt: new Date()
						})
						.where(eq(users.id, user.id));
					
					successCount++;
					console.log(`✅ Updated user ${user.id}: email decrypted`);
				} catch (error) {
					errorCount++;
					console.error(`❌ Failed to update user ${user.id}:`, error);
				}
			}
			
			console.log('\n' + '='.repeat(60));
			console.log('📈 FINAL RESULTS');
			console.log('='.repeat(60));
			console.log(`✅ Successfully decrypted: ${successCount} emails`);
			console.log(`❌ Failed updates: ${errorCount} emails`);
			console.log('='.repeat(60));
			
			if (errorCount > 0) {
				console.log('\n⚠️  Some updates failed. Please check the errors above.');
				process.exit(1);
			} else {
				console.log('\n🎉 All emails decrypted successfully!');
				console.log('📝 Note: Names and phones remain encrypted as intended.');
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
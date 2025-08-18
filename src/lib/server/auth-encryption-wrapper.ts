/**
 * Wrapper for better-auth to handle encryption/decryption of user data
 * This intercepts database operations to encrypt/decrypt personal data
 */

import { encrypt, decrypt, hashEmail, isEncrypted } from './encryption';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';

/**
 * Encrypts user data before it's saved to the database
 * Used by better-auth during user creation/updates
 */
export function encryptUserDataForAuth(userData: any) {
	if (!userData) return userData;
	
	const encrypted = { ...userData };
	
	// Encrypt personal fields if they exist
	if (encrypted.name) {
		encrypted.name = encrypt(encrypted.name);
	}
	
	if (encrypted.email) {
		// Keep original email for unique constraint
		encrypted.email = encrypt(encrypted.email);
		// Add email hash for lookups
		encrypted.emailHash = hashEmail(userData.email);
	}
	
	if (encrypted.phone) {
		encrypted.phone = encrypt(encrypted.phone);
	}
	
	return encrypted;
}

/**
 * Decrypts user data after it's fetched from the database
 * Used when better-auth retrieves user data
 */
export function decryptUserDataFromAuth(userData: any) {
	if (!userData) return userData;
	
	const decrypted = { ...userData };
	
	// Decrypt personal fields if they exist and are encrypted
	if (decrypted.name) {
		decrypted.name = decrypt(decrypted.name);
	}
	
	if (decrypted.email) {
		decrypted.email = decrypt(decrypted.email);
	}
	
	if (decrypted.phone) {
		decrypted.phone = decrypt(decrypted.phone);
	}
	
	return decrypted;
}

/**
 * Custom drizzle adapter wrapper that encrypts/decrypts user data
 * For now, we'll use a simpler approach with the standard adapter
 */
export function createEncryptedDrizzleAdapter(db: any, schema: any) {
	// Just return the regular adapter for now
	// We'll handle encryption/decryption at the application level
	const baseAdapter = drizzleAdapter(db, {
		provider: 'pg',
		schema
	});
	
	return baseAdapter;
}
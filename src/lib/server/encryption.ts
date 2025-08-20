/**
 * MatchTrip Main App Encryption Module
 * 
 * This module wraps the core encryption functions and provides
 * app-specific utilities. The core encryption logic MUST remain
 * consistent across all apps.
 * 
 * See ENCRYPTION_STANDARD.md for the encryption standard.
 */

import { 
	encryptCore, 
	decryptCore, 
	isEncryptedCore,
	isLegacyEncrypted,
	validateEncryptedFormat
} from './encryption-core';

// Re-export core functions with the expected names
export const encrypt = encryptCore;
export const decrypt = decryptCore;
export const isEncrypted = isEncryptedCore;

// Export additional utilities
export { isLegacyEncrypted, validateEncryptedFormat };


/**
 * Decrypt user object fields
 * Helper function to decrypt common user fields
 */
export function decryptUserFields<T extends Record<string, any>>(user: T): T {
	if (!user) return user;

	const decrypted = { ...user } as any;

	// Decrypt personal information fields if they exist
	if ('name' in decrypted && decrypted.name) {
		decrypted.name = decrypt(decrypted.name as string);
	}

	if ('email' in decrypted && decrypted.email) {
		decrypted.email = decrypt(decrypted.email as string);
	}

	if ('phone' in decrypted && decrypted.phone) {
		decrypted.phone = decrypt(decrypted.phone as string);
	}

	return decrypted as T;
}

/**
 * Encrypt user object fields
 * Helper function to encrypt common user fields before saving
 */
export function encryptUserFields<T extends Record<string, any>>(user: Partial<T>): Partial<T> {
	const encrypted: Partial<T> = { ...user };

	// Encrypt personal information fields if they exist
	if ('name' in encrypted && encrypted.name) {
		(encrypted as any).name = encrypt(encrypted.name as string);
	}

	if ('email' in encrypted && encrypted.email) {
		(encrypted as any).email = encrypt(encrypted.email as string);
	}

	if ('phone' in encrypted && encrypted.phone) {
		(encrypted as any).phone = encrypt(encrypted.phone as string);
	}

	return encrypted;
}


/**
 * CORE ENCRYPTION MODULE - DO NOT MODIFY WITHOUT UPDATING ALL APPS
 *
 * This module defines the encryption standard for the MatchTrip platform.
 * It MUST be identical across all applications.
 *
 * See ENCRYPTION_STANDARD.md for full documentation.
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Constants - NEVER CHANGE THESE
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const ENCRYPTED_PREFIX = 'encrypted:';

/**
 * Get encryption key from environment variable
 * The key MUST be exactly 32 bytes when decoded from base64
 */
export function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY;
	if (!key) {
		throw new Error('ENCRYPTION_KEY environment variable is not set');
	}

	// Convert base64 key to buffer
	const keyBuffer = Buffer.from(key, 'base64');

	// Ensure key is 32 bytes for AES-256
	if (keyBuffer.length !== 32) {
		throw new Error(
			`ENCRYPTION_KEY must be exactly 32 bytes (256 bits), got ${keyBuffer.length} bytes`
		);
	}

	return keyBuffer;
}

/**
 * Encrypt a string value using AES-256-GCM
 * @param plainText - The plain text to encrypt
 * @returns Encrypted string in format "encrypted:iv:authTag:encryptedData" (all base64)
 */
export function encryptCore(plainText: string | null | undefined): string | null {
	// Return null for null/undefined, but encrypt empty strings
	if (plainText === null || plainText === undefined) return plainText as any;

	// Empty string is a valid value to encrypt
	if (plainText === '') return null; // Or you could encrypt it, depending on requirements

	try {
		const key = getEncryptionKey();
		const iv = randomBytes(IV_LENGTH);
		const cipher = createCipheriv(ALGORITHM, key, iv);

		const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);

		const authTag = cipher.getAuthTag();

		// CRITICAL: Always use this exact format
		// Format: encrypted:<iv_base64>:<auth_tag_base64>:<encrypted_data_base64>
		const ivBase64 = iv.toString('base64');
		const authTagBase64 = authTag.toString('base64');
		const encryptedBase64 = encrypted.toString('base64');
		const result = `${ENCRYPTED_PREFIX}${ivBase64}:${authTagBase64}:${encryptedBase64}`;

		console.log('[ENCRYPTION DEBUG] Encrypting:', plainText?.substring(0, 10) + '...');
		console.log('[ENCRYPTION DEBUG] IV length:', iv.length, 'base64:', ivBase64);
		console.log('[ENCRYPTION DEBUG] AuthTag length:', authTag.length, 'base64:', authTagBase64);
		console.log(
			'[ENCRYPTION DEBUG] Encrypted length:',
			encrypted.length,
			'base64:',
			encryptedBase64
		);
		console.log('[ENCRYPTION DEBUG] Final result:', result);
		console.log('[ENCRYPTION DEBUG] Result parts count:', result.split(':').length);

		return result;
	} catch (error) {
		console.error('Encryption error:', error);
		throw new Error('Failed to encrypt data');
	}
}

/**
 * Decrypt a string value encrypted with encryptCore()
 * @param encryptedData - The encrypted string
 * @returns Decrypted plain text
 */
export function decryptCore(encryptedData: string | null | undefined): string | null {
	if (!encryptedData) return encryptedData as any;

	// Check if data is encrypted
	if (!encryptedData.startsWith(ENCRYPTED_PREFIX)) {
		// Return as-is if not encrypted (for migration compatibility)
		return encryptedData;
	}

	try {
		// Remove prefix and split parts
		const withoutPrefix = encryptedData.slice(ENCRYPTED_PREFIX.length);
		const parts = withoutPrefix.split(':');

		if (parts.length !== 3) {
			throw new Error(`Invalid encrypted data format. Expected 3 parts, got ${parts.length}`);
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
		console.error('Decryption error:', error);
		throw new Error('Failed to decrypt data');
	}
}

/**
 * Check if a value is encrypted with the current standard
 * @param value - The value to check
 * @returns true if the value is encrypted with current standard
 */
export function isEncryptedCore(value: string | null | undefined): boolean {
	if (!value) return false;
	return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Check if a value uses legacy encryption (for detection only - DO NOT SUPPORT)
 * @param value - The value to check
 * @returns true if the value uses a legacy encryption format
 */
export function isLegacyEncrypted(value: string | null | undefined): boolean {
	if (!value) return false;
	// List of known legacy prefixes - for detection only
	return value.startsWith('ENC:') || value.startsWith('enc:') || value.startsWith('ENCRYPTED:');
}

/**
 * Validate encrypted data format
 * @param encryptedData - The encrypted string to validate
 * @returns true if the format matches the standard
 */
export function validateEncryptedFormat(encryptedData: string): boolean {
	// Must start with 'encrypted:'
	if (!encryptedData.startsWith(ENCRYPTED_PREFIX)) {
		return false;
	}

	// Must have exactly 3 base64 parts separated by colons
	const withoutPrefix = encryptedData.slice(ENCRYPTED_PREFIX.length);
	const parts = withoutPrefix.split(':');

	if (parts.length !== 3) {
		return false;
	}

	// Each part must be valid base64
	const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
	return parts.every((part) => base64Regex.test(part));
}

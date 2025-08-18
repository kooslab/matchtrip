import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { building } from '$app/environment';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const ENCRYPTED_PREFIX = 'encrypted:';

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
	// During build time, return a dummy key
	if (building) {
		return Buffer.alloc(32);
	}
	
	// Try multiple ways to get the encryption key
	let key: string | undefined;
	
	// Try dynamic import for SvelteKit environment
	try {
		const env = process.env;
		key = env.ENCRYPTION_KEY;
	} catch (e) {
		// Fallback to process.env
		key = process.env.ENCRYPTION_KEY;
	}
	
	if (!key) {
		console.error('ENCRYPTION_KEY not found in environment');
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
 * Encrypt a string value using AES-256-GCM
 * @param plainText - The plain text to encrypt
 * @returns Encrypted string in format "encrypted:iv:authTag:encryptedData" (all base64)
 */
export function encrypt(plainText: string | null | undefined): string | null {
	if (!plainText) return plainText as any;
	
	try {
		const key = getEncryptionKey();
		const iv = randomBytes(IV_LENGTH);
		const cipher = createCipheriv(ALGORITHM, key, iv);
		
		const encrypted = Buffer.concat([
			cipher.update(plainText, 'utf8'),
			cipher.final()
		]);
		
		const authTag = cipher.getAuthTag();
		
		// Combine all parts with colon separator
		const combined = `${ENCRYPTED_PREFIX}${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
		
		return combined;
	} catch (error) {
		console.error('Encryption error:', error);
		throw new Error('Failed to encrypt data');
	}
}

/**
 * Decrypt a string value encrypted with encrypt()
 * @param encryptedData - The encrypted string
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string | null | undefined): string | null {
	if (!encryptedData) return encryptedData as any;
	
	// Check if data is encrypted (for migration period)
	if (!isEncrypted(encryptedData)) {
		// Return as-is if not encrypted (plain text during migration)
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

/**
 * Check if a value is encrypted
 * @param value - The value to check
 * @returns true if the value is encrypted
 */
export function isEncrypted(value: string | null | undefined): boolean {
	if (!value) return false;
	return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Hash an email for indexing and lookups
 * Uses SHA-256 for consistent hashing
 * @param email - The email to hash
 * @returns Hashed email string
 */
export function hashEmail(email: string | null | undefined): string | null {
	if (!email) return null;
	
	// Normalize email to lowercase for consistent hashing
	const normalizedEmail = email.toLowerCase().trim();
	
	// Create SHA-256 hash
	const hash = createHash('sha256');
	hash.update(normalizedEmail);
	
	return hash.digest('hex');
}

/**
 * Decrypt user object fields
 * Helper function to decrypt common user fields
 */
export function decryptUserFields<T extends Record<string, any>>(user: T): T {
	if (!user) return user;
	
	const decrypted = { ...user };
	
	// Decrypt personal information fields if they exist
	if ('name' in decrypted) {
		decrypted.name = decrypt(decrypted.name as string);
	}
	
	if ('email' in decrypted) {
		decrypted.email = decrypt(decrypted.email as string);
	}
	
	if ('phone' in decrypted) {
		decrypted.phone = decrypt(decrypted.phone as string);
	}
	
	return decrypted;
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
		// Also create email hash for lookups
		(encrypted as any).email_hash = hashEmail(user.email as string);
	}
	
	if ('phone' in encrypted && encrypted.phone) {
		(encrypted as any).phone = encrypt(encrypted.phone as string);
	}
	
	return encrypted;
}

/**
 * Prepare email for lookup
 * During migration, this checks if we should use hash or direct lookup
 */
export function prepareEmailForLookup(email: string): { 
	useHash: boolean; 
	value: string;
} {
	// For now, during migration, we'll try both methods
	// Once migration is complete, we'll only use hash
	return {
		useHash: true,
		value: hashEmail(email)!
	};
}
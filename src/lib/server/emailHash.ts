import { createHash } from 'crypto';

/**
 * Creates a SHA-256 hash of an email address
 * Normalizes the email to lowercase before hashing for consistency
 */
export function hashEmail(email: string): string {
	// Normalize email to lowercase for consistent hashing
	const normalizedEmail = email.toLowerCase().trim();
	
	// Create SHA-256 hash
	const hash = createHash('sha256');
	hash.update(normalizedEmail);
	
	// Return hex-encoded hash
	return hash.digest('hex');
}

/**
 * Compares an email with a hash to check if they match
 */
export function verifyEmailHash(email: string, hash: string): boolean {
	return hashEmail(email) === hash;
}
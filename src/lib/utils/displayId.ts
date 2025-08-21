import { customAlphabet } from 'nanoid';

// Custom alphabet for readable IDs (uppercase letters and numbers)
// Excluding similar-looking characters (0, O, I, 1, L) for better readability
const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generateShortId = customAlphabet(alphabet, 5);

/**
 * Get the current year and month in YYMM format
 */
function getYearMonth(): string {
	const now = new Date();
	const year = now.getFullYear().toString().slice(-2);
	const month = (now.getMonth() + 1).toString().padStart(2, '0');
	return `${year}${month}`;
}

/**
 * Generate a display ID for an offer
 * Format: OFFER-YYMM-XXXXX
 */
export function generateOfferDisplayId(): string {
	return `OFFER-${getYearMonth()}-${generateShortId()}`;
}

/**
 * Generate a display ID for a product
 * Format: PRD-YYMM-XXXXX
 */
export function generateProductDisplayId(): string {
	return `PRD-${getYearMonth()}-${generateShortId()}`;
}

/**
 * Generate a display ID for an offer-based order (payment)
 * Format: ORD-YYMM-XXXXX
 */
export function generateOfferOrderId(): string {
	return `ORD-${getYearMonth()}-${generateShortId()}`;
}

/**
 * Generate a display ID for a product-based order (payment)
 * Format: PORD-YYMM-XXXXX
 */
export function generateProductOrderId(): string {
	return `PORD-${getYearMonth()}-${generateShortId()}`;
}

/**
 * Generate a display ID for a product offer
 * Format: POFFER-YYMM-XXXXX
 */
export function generateProductOfferDisplayId(): string {
	return `POFFER-${getYearMonth()}-${generateShortId()}`;
}

/**
 * Parse a display ID to extract its components
 */
export function parseDisplayId(displayId: string): {
	prefix: string;
	yearMonth: string;
	shortId: string;
} | null {
	const match = displayId.match(/^([A-Z]+)-(\d{4})-([A-Z0-9]{5})$/);
	if (!match) return null;
	
	return {
		prefix: match[1],
		yearMonth: match[2],
		shortId: match[3]
	};
}

/**
 * Validate if a string is a valid display ID
 */
export function isValidDisplayId(displayId: string): boolean {
	return /^[A-Z]+-\d{4}-[A-Z0-9]{5}$/.test(displayId);
}

/**
 * Format a display ID for user display (with spacing for readability)
 */
export function formatDisplayId(displayId: string): string {
	const parts = parseDisplayId(displayId);
	if (!parts) return displayId;
	
	// Add spacing for better readability when displayed
	return `${parts.prefix}-${parts.yearMonth}-${parts.shortId}`;
}
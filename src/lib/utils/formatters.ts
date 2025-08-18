/**
 * Format a price value with thousand separators
 * @param amount - The amount to format
 * @param currency - The currency symbol to use (default: '₩')
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(amount: number, currency: string = '₩'): string {
	if (!amount && amount !== 0) return `${currency}0`;
	return `${currency}${amount.toLocaleString()}`;
}

/**
 * Format a budget range with thousand separators
 * @param min - Minimum budget amount
 * @param max - Maximum budget amount
 * @param currency - The currency symbol to use (default: '₩')
 * @returns Formatted budget range string
 */
export function formatBudget(min: number | null, max: number | null, currency: string = '₩'): string {
	if (!min && !max) return '예산 미정';
	if (!max) return `${currency}${min?.toLocaleString()} 이상`;
	return `${currency}${min?.toLocaleString()} - ${currency}${max?.toLocaleString()}`;
}

/**
 * Format a single budget amount
 * @param amount - The amount to format
 * @param currency - The currency symbol to use (default: '₩')
 * @returns Formatted budget string
 */
export function formatBudgetAmount(amount: number | null, currency: string = '₩'): string {
	if (!amount) return '';
	return `${currency}${amount.toLocaleString()}`;
}
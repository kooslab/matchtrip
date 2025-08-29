/**
 * IMPORTANT NOTE (as of 2025-08-29):
 * =========================================
 * These formatter functions are currently NOT USED in guide onboarding.
 * 
 * Guide onboarding has been updated to use flexible validation without pattern formatting:
 * - Accepts 7-15 digits (ITU-T E.164 standard)
 * - No country-specific formatting patterns
 * - See: /routes/onboarding/guide/+page.svelte
 * 
 * These functions are kept for potential future use if pattern formatting
 * needs to be re-implemented. Traveler onboarding still uses its own
 * validation for Korean phone numbers.
 * =========================================
 */

/**
 * Formats a phone number string to German/European format
 * 
 * STATUS: Currently unused - kept for future use
 * 
 * Automatically adds '+' prefix for international format
 * Supports formats like:
 * - German mobile: +49 176 12345678
 * - German landline: +49 30 12345678
 * - Other European countries: +33, +34, +39, etc.
 * @param value - The input phone number string
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
	// If empty, return empty
	if (!value) return '';

	// Remove all non-digits except the initial +
	let digits = value.replace(/[^\d+]/g, '');

	// If user types only digits (no + at start), automatically add +
	if (digits && !digits.startsWith('+') && !digits.startsWith('0')) {
		digits = '+' + digits;
	}

	// Handle international format (+49)
	if (digits.startsWith('+49')) {
		const numberPart = digits.slice(3);
		if (numberPart.length <= 3) {
			return '+49 ' + numberPart;
		} else if (numberPart.length <= 6) {
			return `+49 ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
		} else {
			// Format as +49 XXX XXXXXXXX (mobile) or +49 XX XXXXXXXX (landline)
			// Check if it's a mobile number (starts with 1)
			if (numberPart.startsWith('1')) {
				return `+49 ${numberPart.slice(0, 3)} ${numberPart.slice(3, 11)}`;
			} else {
				// Landline format
				return `+49 ${numberPart.slice(0, 2)} ${numberPart.slice(2, 10)}`;
			}
		}
	}
	// Handle national format (0176...) - keep as is for backwards compatibility
	else if (digits.startsWith('0')) {
		if (digits.length <= 4) {
			return digits;
		} else if (digits.length <= 7) {
			return `${digits.slice(0, 4)} ${digits.slice(4)}`;
		} else {
			// Check if it's a mobile number (starts with 01)
			if (digits.startsWith('01')) {
				return `${digits.slice(0, 4)} ${digits.slice(4, 12)}`;
			} else {
				// Landline format
				return `${digits.slice(0, 3)} ${digits.slice(3, 11)}`;
			}
		}
	}
	// Handle other European country codes
	else if (digits.startsWith('+')) {
		// Generic international format: +XX XXX XXXXXXX
		const countryCodeMatch = digits.match(/^\+(\d{1,3})/);
		if (countryCodeMatch) {
			const countryCode = countryCodeMatch[1];
			const numberPart = digits.slice(countryCode.length + 1);

			if (numberPart.length === 0) {
				return `+${countryCode}`;
			} else if (numberPart.length <= 3) {
				return `+${countryCode} ${numberPart}`;
			} else if (numberPart.length <= 6) {
				return `+${countryCode} ${numberPart.slice(0, 3)} ${numberPart.slice(3)}`;
			} else {
				return `+${countryCode} ${numberPart.slice(0, 3)} ${numberPart.slice(3, 10)}`;
			}
		}
		return digits;
	}
	// Should not reach here due to auto-prefix logic above
	else {
		return digits;
	}
}

/**
 * Creates an input event handler for phone number formatting
 * 
 * STATUS: Currently unused - kept for future use
 * 
 * @param setValue - Function to set the phone number value in the component
 * @returns Event handler function
 */
export function createPhoneInputHandler(setValue: (value: string) => void) {
	return (event: Event) => {
		const target = event.target as HTMLInputElement;
		const formatted = formatPhoneNumber(target.value);
		setValue(formatted);
		target.value = formatted;
	};
}

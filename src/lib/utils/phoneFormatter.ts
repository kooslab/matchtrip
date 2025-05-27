/**
 * Formats a phone number string to XXX-XXXX-XXXX format
 * @param value - The input phone number string
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
	// Remove all non-digits
	const digits = value.replace(/\D/g, '');

	// Apply XXX-XXXX-XXXX format
	if (digits.length <= 3) {
		return digits;
	} else if (digits.length <= 7) {
		return `${digits.slice(0, 3)}-${digits.slice(3)}`;
	} else {
		return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
	}
}

/**
 * Creates an input event handler for phone number formatting
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

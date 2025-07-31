/**
 * Formats a number string with commas (Korean format)
 */
export function formatNumberWithCommas(value: string | number): string {
	const cleanValue = value.toString().replace(/[^\d]/g, '');
	if (!cleanValue) return '';
	return new Intl.NumberFormat('ko-KR').format(parseInt(cleanValue));
}

/**
 * Removes all non-numeric characters from a string
 */
export function cleanNumericString(value: string): string {
	return value.replace(/[^\d]/g, '');
}

/**
 * Handles real-time number input with comma formatting
 * Returns the cleaned numeric value and sets up the display value with proper cursor positioning
 */
export function handleFormattedNumberInput(
	input: HTMLInputElement,
	currentValue: string
): {
	rawValue: string;
	displayValue: string;
} {
	const cursorPos = input.selectionStart || 0;
	const oldValue = input.value;

	// Count commas before cursor position
	const commasBefore = (oldValue.substring(0, cursorPos).match(/,/g) || []).length;

	// Remove all non-numeric characters
	const cleanValue = cleanNumericString(currentValue);

	// Format with commas for display
	const formattedValue = formatNumberWithCommas(cleanValue);

	// Calculate new cursor position after formatting
	if (cleanValue && formattedValue) {
		setTimeout(() => {
			const commasInNew = (formattedValue.match(/,/g) || []).length;

			// Find position without commas
			let posWithoutCommas = cursorPos - commasBefore;

			// Add back commas for new position
			let newPos = posWithoutCommas;
			let commaCount = 0;
			for (let i = 0; i < formattedValue.length && commaCount < commasInNew; i++) {
				if (formattedValue[i] === ',') {
					if (i < newPos + commaCount) {
						newPos++;
					}
					commaCount++;
				}
			}

			// Ensure cursor position is within bounds
			newPos = Math.max(0, Math.min(newPos, formattedValue.length));
			input.setSelectionRange(newPos, newPos);
		}, 0);
	}

	return {
		rawValue: cleanValue,
		displayValue: formattedValue
	};
}

/**
 * Creates a formatted number input handler for Svelte components
 */
export function createNumberInputHandler(
	updateRawValue: (value: string) => void,
	updateDisplayValue: (value: string) => void
) {
	return function handleInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const result = handleFormattedNumberInput(input, input.value);

		updateRawValue(result.rawValue);
		updateDisplayValue(result.displayValue);
	};
}

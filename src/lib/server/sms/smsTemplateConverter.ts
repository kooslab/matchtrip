import templates from '$lib/server/kakao/templates.json';
import type { TemplateData } from '$lib/server/kakao/templateHelper';

/**
 * Convert Kakao AlimTalk template to SMS format
 * Includes the full URL since SMS doesn't have clickable buttons
 */
export function convertKakaoTemplateToSMS(
	templateName: string,
	templateData: TemplateData,
	isDev: boolean = process.env.NODE_ENV !== 'production'
): string {
	// Get template from templates.json - find by name in the correct environment
	const templateSource = isDev ? templates.dev : templates.prod;
	let foundTemplate: any = null;

	for (const template of Object.values(templateSource)) {
		if ((template as any).name === templateName) {
			foundTemplate = template;
			break;
		}
	}

	if (!foundTemplate) {
		throw new Error(`Template ${templateName} not found`);
	}

	// Start with the template text
	let smsText = foundTemplate.text;

	// Replace variables in the text
	for (const [key, value] of Object.entries(templateData)) {
		const placeholder = `#{${key}}`;
		smsText = smsText.replace(new RegExp(placeholder, 'g'), value);
	}

	// Add button URL if exists - button URLs are now directly on the button object
	if (foundTemplate.button) {
		const buttonUrl = foundTemplate.button.urlMobile || foundTemplate.button.urlPc;

		if (buttonUrl) {
			// Add line breaks and the button as a text link
			smsText += `\n\n${foundTemplate.button.name}: ${buttonUrl}`;
		}
	}

	return smsText;
}

/**
 * Format SMS message with proper encoding for international characters
 * Ensures the message is properly formatted for SMS delivery
 */
export function formatSMSMessage(message: string): string {
	// Ensure proper line breaks
	message = message.replace(/\r\n/g, '\n');
	
	// Trim excessive whitespace
	message = message.trim();
	
	// Limit message length (SMS has 160 character limit for basic, 70 for Unicode)
	// Since we use Korean characters, we're in Unicode mode (70 chars per segment)
	// But modern SMS can concatenate multiple segments, so we'll allow up to 3 segments (210 chars)
	const maxLength = 210;
	if (message.length > maxLength) {
		message = message.substring(0, maxLength - 3) + '...';
	}
	
	return message;
}

/**
 * Get SMS-friendly version of template
 * Some templates might be too long for SMS, this provides shorter versions
 */
export function getSMSTemplate(templateName: string, isDev: boolean = process.env.NODE_ENV !== 'production'): any {
	const templateSource = isDev ? templates.dev : templates.prod;
	let foundTemplate: any = null;

	for (const template of Object.values(templateSource)) {
		if ((template as any).name === templateName) {
			foundTemplate = template;
			break;
		}
	}

	if (!foundTemplate) {
		return null;
	}
	const template = foundTemplate;
	
	// For some templates, we might want to provide shorter versions for SMS
	// This can be expanded based on needs
	const smsOverrides: Record<string, { text?: string }> = {
		// Example: Shorten long templates
		'remind01': {
			text: '[#{SHOPNAME}] #{NAME}님의 여행이 곧 시작됩니다!'
		},
		'remind02': {
			text: '[#{SHOPNAME}] #{NAME}님과의 여행이 곧 시작됩니다!'
		}
	};
	
	// Return template with any SMS-specific overrides
	if (smsOverrides[templateName]) {
		return {
			...template,
			...smsOverrides[templateName]
		};
	}
	
	return template;
}
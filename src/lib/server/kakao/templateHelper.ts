import templates from './templates.json';
import { env } from '$env/dynamic/private';
import type { KakaoButton } from './kakaoAlimTalk';

export interface TemplateData {
	[key: string]: string;
}

export interface ProcessedTemplate {
	text: string;
	button?: KakaoButton;
}

/**
 * Get template by code
 */
export function getTemplate(templateCode: string) {
	if (!templates[templateCode]) {
		throw new Error(`Template ${templateCode} not found`);
	}
	return templates[templateCode];
}

/**
 * Get the base URL from environment
 */
function getBaseUrl(): string {
	// Use PUBLIC_APP_URL if available, otherwise default to dev URL
	return env.PUBLIC_APP_URL || 'https://dev.matchtrip.net';
}

/**
 * Process template text by replacing variables
 */
export function processTemplateText(text: string, data: TemplateData): string {
	let processedText = text;
	for (const [key, value] of Object.entries(data)) {
		const placeholder = `#{${key}}`;
		processedText = processedText.replace(new RegExp(placeholder, 'g'), value);
	}
	return processedText;
}

/**
 * Prepare a complete template for sending
 */
export function prepareTemplate(
	templateCode: string,
	data: TemplateData
): ProcessedTemplate {
	const template = getTemplate(templateCode);
	const baseUrl = getBaseUrl();
	
	// Process the text with variable replacement
	const processedText = processTemplateText(template.text, data);
	
	// Process button URLs if button exists
	let processedButton = template.button;
	if (processedButton) {
		processedButton = {
			...processedButton,
			urlMobile: processedButton.urlMobile?.replace('{{BASE_URL}}', baseUrl),
			urlPc: processedButton.urlPc?.replace('{{BASE_URL}}', baseUrl)
		};
	}
	
	// Return processed template with button if exists
	return {
		text: processedText,
		button: processedButton || undefined
	};
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateData(
	templateCode: string,
	data: TemplateData
): { valid: boolean; missing: string[] } {
	const template = getTemplate(templateCode);
	const missing: string[] = [];
	
	for (const variable of template.variables) {
		if (!data[variable]) {
			missing.push(variable);
		}
	}
	
	return {
		valid: missing.length === 0,
		missing
	};
}

/**
 * Get all available template codes
 */
export function getAvailableTemplates(): string[] {
	return Object.keys(templates);
}

/**
 * Get template info for display purposes
 */
export function getTemplateInfo(templateCode: string) {
	const template = getTemplate(templateCode);
	return {
		code: templateCode,
		name: template.name,
		description: template.description,
		variables: template.variables,
		hasButton: !!template.button,
		buttonName: template.button?.name
	};
}
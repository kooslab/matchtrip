import templates from './templates.json';
import type { KakaoButton } from './kakaoAlimTalk';

export interface TemplateData {
	[key: string]: string;
}

export interface ProcessedTemplate {
	text: string;
	button?: KakaoButton;
}

/**
 * Get template by code for the current environment
 */
export function getTemplate(templateCode: string, environment: 'dev' | 'prod' = 'dev') {
	const envTemplates = templates[environment];
	if (!envTemplates || !envTemplates[templateCode]) {
		throw new Error(`Template ${templateCode} not found for environment ${environment}`);
	}
	return envTemplates[templateCode];
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
	data: TemplateData,
	environment: 'dev' | 'prod' = 'dev'
): ProcessedTemplate {
	const template = getTemplate(templateCode, environment);
	
	// Process the text with variable replacement
	const processedText = processTemplateText(template.text, data);
	
	// Return processed template with button if exists
	return {
		text: processedText,
		button: template.button || undefined
	};
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateData(
	templateCode: string,
	data: TemplateData,
	environment: 'dev' | 'prod' = 'dev'
): { valid: boolean; missing: string[] } {
	const template = getTemplate(templateCode, environment);
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
 * Get all available template codes for an environment
 */
export function getAvailableTemplates(environment: 'dev' | 'prod' = 'dev'): string[] {
	const envTemplates = templates[environment];
	return envTemplates ? Object.keys(envTemplates) : [];
}

/**
 * Get template info for display purposes
 */
export function getTemplateInfo(templateCode: string, environment: 'dev' | 'prod' = 'dev') {
	const template = getTemplate(templateCode, environment);
	return {
		code: templateCode,
		name: template.name,
		description: template.description,
		variables: template.variables,
		hasButton: !!template.button,
		buttonName: template.button?.name
	};
}
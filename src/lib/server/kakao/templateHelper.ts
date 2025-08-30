import templatesConfig from './templates.json';
import { env } from '$env/dynamic/private';
import type { KakaoButton } from './kakaoAlimTalk';

export interface TemplateData {
	[key: string]: string;
}

export interface ProcessedTemplate {
	text: string;
	button?: KakaoButton;
	templateCode: string;
}

/**
 * Get current environment
 */
function getEnvironment(): 'dev' | 'prod' {
	// Check NODE_ENV or other env variables to determine environment
	// Default to 'dev' for safety
	const environment = env.NODE_ENV === 'production' ? 'prod' : 'dev';
	console.log('[TemplateHelper] Environment detected:', {
		NODE_ENV: env.NODE_ENV,
		resolved: environment
	});
	return environment;
}

/**
 * Get template by logical name (e.g., 'signup01', 'mytrip01')
 */
export function getTemplate(templateName: string) {
	const templates = templatesConfig.templates as Record<string, any>;
	console.log('[TemplateHelper] Looking for template:', templateName);
	console.log('[TemplateHelper] Available templates:', Object.keys(templates));
	
	if (!templates[templateName]) {
		console.error('[TemplateHelper] ❌ Template not found:', templateName);
		throw new Error(`Template ${templateName} not found`);
	}
	
	console.log('[TemplateHelper] ✅ Template found:', {
		name: templateName,
		hasDevCode: !!templates[templateName].dev,
		hasProdCode: !!templates[templateName].prod
	});
	return templates[templateName];
}

/**
 * Get template code for current environment
 */
export function getTemplateCode(templateName: string): string {
	const template = getTemplate(templateName);
	const env = getEnvironment();
	return template[env];
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
export function prepareTemplate(templateName: string, data: TemplateData): ProcessedTemplate {
	console.log('[TemplateHelper] prepareTemplate called:', {
		templateName,
		dataKeys: Object.keys(data)
	});
	
	const template = getTemplate(templateName);
	const env = getEnvironment();
	const templateCode = template[env];
	
	console.log('[TemplateHelper] Template code selected:', {
		environment: env,
		templateCode: templateCode
	});

	// Process the text with variable replacement
	const processedText = processTemplateText(template.text, data);
	console.log('[TemplateHelper] Text processed:', {
		originalLength: template.text.length,
		processedLength: processedText.length,
		preview: processedText.substring(0, 50) + '...'
	});

	// Get environment-specific button URLs
	let processedButton: KakaoButton | undefined;
	if (template.button) {
		const buttonUrls = template.button[env];
		if (buttonUrls) {
			processedButton = {
				type: template.button.type,
				name: template.button.name,
				urlMobile: buttonUrls.urlMobile,
				urlPc: buttonUrls.urlPc
			};
			console.log('[TemplateHelper] Button configured:', {
				name: processedButton.name,
				hasMobileUrl: !!processedButton.urlMobile,
				hasPcUrl: !!processedButton.urlPc
			});
		}
	}

	// Return processed template with button if exists
	const result = {
		text: processedText,
		button: processedButton,
		templateCode
	};
	
	console.log('[TemplateHelper] Final template prepared:', {
		templateCode: result.templateCode,
		hasText: !!result.text,
		hasButton: !!result.button
	});
	
	return result;
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateData(
	templateName: string,
	data: TemplateData
): { valid: boolean; missing: string[] } {
	const template = getTemplate(templateName);
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
 * Get all available template names
 */
export function getAvailableTemplates(): string[] {
	return Object.keys(templatesConfig.templates);
}

/**
 * Get template info for display purposes
 */
export function getTemplateInfo(templateName: string) {
	const template = getTemplate(templateName);
	const env = getEnvironment();
	return {
		name: templateName,
		code: template[env],
		description: template.description,
		variables: template.variables,
		hasButton: !!template.button,
		buttonName: template.button?.name,
		environment: env
	};
}

/**
 * Helper to get template by old code (for backward compatibility)
 */
export function getTemplateByCode(templateCode: string): string | null {
	for (const [name, template] of Object.entries(templatesConfig.templates)) {
		if (template.dev === templateCode || template.prod === templateCode) {
			return name;
		}
	}
	return null;
}

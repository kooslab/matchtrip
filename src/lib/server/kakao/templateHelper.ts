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
	// Check if we're using the test Kakao channel
	// If KAKAO_TEST_MODE is set, always use dev templates regardless of NODE_ENV
	const isTestMode = env.KAKAO_TEST_MODE === 'true' || env.KAKAO_TEST_MODE === '1';
	
	// Check NODE_ENV or other env variables to determine environment
	// Default to 'dev' for safety
	const environment = isTestMode ? 'dev' : (env.NODE_ENV === 'production' ? 'prod' : 'dev');
	console.log('[TemplateHelper] Environment detected:', {
		NODE_ENV: env.NODE_ENV,
		KAKAO_TEST_MODE: env.KAKAO_TEST_MODE,
		resolved: environment
	});
	return environment;
}

/**
 * Get template by logical name (e.g., 'signup01', 'mytrip01')
 */
export function getTemplate(templateName: string) {
	const env = getEnvironment();
	const templateSource = env === 'dev' ? templatesConfig.dev : templatesConfig.prod;
	
	console.log('[TemplateHelper] Looking for template:', templateName);
	console.log('[TemplateHelper] Environment:', env);
	
	// Find template by name property in the current environment
	let foundTemplate = null;
	let foundCode = null;
	
	for (const [code, template] of Object.entries(templateSource || {})) {
		if ((template as any).name === templateName) {
			foundTemplate = template;
			foundCode = code;
			break;
		}
	}
	
	if (!foundTemplate) {
		console.error('[TemplateHelper] ❌ Template not found:', templateName);
		console.error('[TemplateHelper] Available templates in', env + ':', 
			Object.entries(templateSource || {}).map(([k, v]: [string, any]) => v.name)
		);
		throw new Error(`Template ${templateName} not found in ${env} environment`);
	}
	
	console.log('[TemplateHelper] ✅ Template found:', {
		name: templateName,
		code: foundCode,
		environment: env
	});
	
	// Return template with the code embedded for easier access
	return {
		...foundTemplate,
		[env]: foundCode
	};
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
	const templateCode = template[env]; // This was embedded by getTemplate
	
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

	// Get button URLs - they're directly on the button object now, not nested in env
	let processedButton: KakaoButton | undefined;
	if (template.button) {
		processedButton = {
			type: template.button.type,
			name: template.button.name,
			urlMobile: template.button.urlMobile,
			urlPc: template.button.urlPc
		};
		console.log('[TemplateHelper] Button configured:', {
			name: processedButton.name,
			hasMobileUrl: !!processedButton.urlMobile,
			hasPcUrl: !!processedButton.urlPc
		});
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

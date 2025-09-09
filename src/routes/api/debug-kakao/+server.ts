import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getTemplate, getTemplateCode, prepareTemplate } from '$lib/server/kakao/templateHelper';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';

export const GET: RequestHandler = async () => {
	console.log('========================================');
	console.log('[DEBUG KAKAO] Configuration Check');
	console.log('========================================');
	
	// Check environment variables
	const envCheck = {
		NODE_ENV: process.env.NODE_ENV || 'not set',
		hasInfobipApiKey: !!env.INFOBIP_API_KEY,
		infobipApiKeyLength: env.INFOBIP_API_KEY?.length || 0,
		infobipApiKeyPrefix: env.INFOBIP_API_KEY?.substring(0, 10) || 'not set',
		hasInfobipBaseUrl: !!env.INFOBIP_BASE_URL,
		infobipBaseUrl: env.INFOBIP_BASE_URL || 'not set',
		hasKakaoChannelKey: !!env.KAKAO_CHANNEL_PROFILE_KEY,
		kakaoChannelKey: env.KAKAO_CHANNEL_PROFILE_KEY || 'not set',
		hasEncryptionKey: !!env.ENCRYPTION_KEY,
		encryptionKeyLength: env.ENCRYPTION_KEY?.length || 0
	};
	
	console.log('[DEBUG KAKAO] Environment variables:', envCheck);
	
	// Check template configuration
	let templateCheck: any = {};
	try {
		const signup01Template = getTemplate('signup01');
		const templateCode = getTemplateCode('signup01');
		
		templateCheck = {
			templateFound: true,
			templateName: 'signup01',
			currentEnvironment: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
			templateCode: templateCode,
			templateDevCode: signup01Template.dev,
			templateProdCode: signup01Template.prod,
			hasText: !!signup01Template.text,
			hasButton: !!signup01Template.button,
			buttonName: signup01Template.button?.name,
			variables: signup01Template.variables
		};
		
		console.log('[DEBUG KAKAO] Template configuration:', templateCheck);
		
		// Test template preparation
		const preparedTemplate = prepareTemplate('signup01', {
			SHOPNAME: '매치트립',
			NAME: 'Test User'
		});
		
		templateCheck.preparedTemplate = {
			templateCode: preparedTemplate.templateCode,
			textLength: preparedTemplate.text?.length,
			textPreview: preparedTemplate.text?.substring(0, 100),
			hasButton: !!preparedTemplate.button,
			buttonUrls: preparedTemplate.button ? {
				mobile: preparedTemplate.button.urlMobile,
				pc: preparedTemplate.button.urlPc
			} : null
		};
		
		console.log('[DEBUG KAKAO] Prepared template:', templateCheck.preparedTemplate);
		
	} catch (error) {
		console.error('[DEBUG KAKAO] Template error:', error);
		templateCheck.error = error instanceof Error ? error.message : 'Unknown error';
	}
	
	// Check KakaoAlimTalk service
	const serviceCheck = {
		hasService: !!kakaoAlimTalk,
		serviceConfigured: !!(env.INFOBIP_API_KEY && env.INFOBIP_BASE_URL && env.KAKAO_CHANNEL_PROFILE_KEY)
	};
	
	console.log('[DEBUG KAKAO] Service check:', serviceCheck);
	
	// Test template codes from templates.json
	let allTemplates: any = {};
	try {
		const templates = ['signup01', 'signup02', 'mytrip01', 'mytrip02', 'settlement01', 'myoffers01'];
		for (const name of templates) {
			try {
				const template = getTemplate(name);
				const code = getTemplateCode(name);
				allTemplates[name] = {
					currentCode: code,
					devCode: template.dev,
					prodCode: template.prod,
					isDeprecated: template.dev?.startsWith('testcode0') && parseInt(template.dev.replace('testcode', '')) < 21
				};
			} catch (e) {
				allTemplates[name] = { error: 'Template not found' };
			}
		}
	} catch (error) {
		console.error('[DEBUG KAKAO] Error checking templates:', error);
	}
	
	console.log('[DEBUG KAKAO] All templates status:', allTemplates);
	console.log('========================================');
	
	// Return comprehensive debug information
	return json({
		timestamp: new Date().toISOString(),
		environment: envCheck,
		templateConfiguration: templateCheck,
		serviceStatus: serviceCheck,
		allTemplates: allTemplates,
		recommendations: {
			envVarsConfigured: envCheck.hasInfobipApiKey && envCheck.hasInfobipBaseUrl && envCheck.hasKakaoChannelKey,
			templateCorrect: templateCheck.templateCode === 'testcode21' || templateCheck.templateCode === 'code01',
			readyToSend: serviceCheck.serviceConfigured && !templateCheck.error
		}
	});
};
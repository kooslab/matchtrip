import { json } from '@sveltejs/kit';
import { infobipSMS } from '$lib/server/sms/infobip';
import { notificationService } from '$lib/server/services/notificationService';
import { convertKakaoTemplateToSMS, formatSMSMessage } from '$lib/server/sms/smsTemplateConverter';
import { formatPhoneForInternationalSMS } from '$lib/server/utils/phoneVerification';
import type { RequestHandler } from './$types';

// Test SMS fallback with notification service
export const POST: RequestHandler = async ({ request, url }) => {
	try {
		const testType = url.searchParams.get('type') || 'direct';
		
		if (testType === 'notification') {
			// Test through notification service (with routing logic)
			const { phoneNumber, templateName, templateData } = await request.json();
			
			if (!phoneNumber || !templateName || !templateData) {
				return json({ 
					error: 'Missing required fields: phoneNumber, templateName, templateData' 
				}, { status: 400 });
			}
			
			console.log('Testing notification service with:', {
				phoneNumber,
				templateName,
				templateData
			});
			
			const result = await notificationService.sendNotification({
				phoneNumber,
				templateName,
				templateData,
				skipDuplicateCheck: true
			});
			
			return json({
				success: true,
				type: 'notification_service',
				result
			});
			
		} else if (testType === 'template') {
			// Test template conversion
			const { templateName, templateData, phoneNumber } = await request.json();
			
			if (!templateName || !templateData) {
				return json({ 
					error: 'Missing required fields: templateName, templateData' 
				}, { status: 400 });
			}
			
			const isDev = process.env.NODE_ENV !== 'production';
			const smsMessage = convertKakaoTemplateToSMS(templateName, templateData, isDev);
			const formattedMessage = formatSMSMessage(smsMessage);
			const formattedPhone = phoneNumber ? formatPhoneForInternationalSMS(phoneNumber) : null;
			
			return json({
				success: true,
				type: 'template_conversion',
				result: {
					originalTemplate: templateName,
					smsMessage,
					formattedMessage,
					formattedPhone,
					isDev
				}
			});
			
		} else {
			// Direct SMS test (original functionality)
			const { to, text } = await request.json();

			if (!to || !text) {
				return json({ error: 'Missing required fields: to, text' }, { status: 400 });
			}

			const result = await infobipSMS.sendSMS({
				to,
				text
			});

			return json({
				success: true,
				type: 'direct_sms',
				result
			});
		}
	} catch (error) {
		console.error('SMS testing error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to test SMS'
			},
			{ status: 500 }
		);
	}
};

// GET endpoint to show usage
export const GET: RequestHandler = async () => {
	return json({
		success: true,
		endpoints: {
			'?type=direct': {
				description: 'Send direct SMS',
				body: {
					to: 'Phone number with country code (e.g., +1234567890)',
					text: 'SMS message content'
				}
			},
			'?type=template': {
				description: 'Test template conversion without sending',
				body: {
					templateName: 'Template name (e.g., signup01)',
					templateData: 'Template variables object',
					phoneNumber: 'Optional phone number to test formatting'
				}
			},
			'?type=notification': {
				description: 'Test full notification flow with routing',
				body: {
					phoneNumber: 'Phone number (any format)',
					templateName: 'Template name (e.g., signup01)',
					templateData: 'Template variables object'
				}
			}
		},
		examples: {
			direct: {
				to: '+1234567890',
				text: 'Test SMS message'
			},
			template: {
				templateName: 'signup01',
				templateData: {
					NAME: 'Test User',
					SHOPNAME: '매치트립'
				},
				phoneNumber: '+1234567890'
			},
			notification: {
				phoneNumber: '+447911123456',
				templateName: 'signup01',
				templateData: {
					NAME: 'John Doe',
					SHOPNAME: '매치트립'
				}
			}
		}
	});
};

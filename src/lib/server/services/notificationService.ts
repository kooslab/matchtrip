import { db } from '$lib/server/db';
import { kakaoNotifications, users } from '$lib/server/db/schema';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import {
	prepareTemplate,
	validateTemplateData,
	getTemplateCode,
	type TemplateData
} from '$lib/server/kakao/templateHelper';
import { eq } from 'drizzle-orm';
import { infobipSMS } from '$lib/server/sms/infobip';
import { convertKakaoTemplateToSMS, formatSMSMessage } from '$lib/server/sms/smsTemplateConverter';
import { formatPhoneForInternationalSMS } from '$lib/server/utils/phoneVerification';

export interface NotificationOptions {
	userId?: string;
	phoneNumber?: string;
	templateCode?: string; // Direct template code (e.g., 'testcode01' or 'code01')
	templateName?: string; // Template name (e.g., 'signup01')
	templateData: TemplateData;
	skipDuplicateCheck?: boolean;
}

export class NotificationService {
	private db: any;

	constructor() {
		this.db = db;
	}

	/**
	 * Check if phone number is Korean (for Kakao AlimTalk)
	 */
	private isKoreanPhoneNumber(phone: string): boolean {
		const cleaned = phone.replace(/\D/g, '');
		
		// Check if starts with Korean country code 82
		if (cleaned.startsWith('82')) {
			return true;
		}
		
		// Check if starts with +82
		if (phone.startsWith('+82')) {
			return true;
		}
		
		// Check if it's a local Korean number (starts with 0)
		if (cleaned.startsWith('0') && (cleaned.length === 10 || cleaned.length === 11)) {
			return true;
		}
		
		return false;
	}

	/**
	 * Format phone number for AlimTalk (Korean format)
	 */
	private formatPhoneNumber(phone: string): string {
		// Remove all non-numeric characters
		let cleaned = phone.replace(/\D/g, '');

		// Check if it starts with country code 82 (Korea)
		if (cleaned.startsWith('82')) {
			return cleaned; // Already in correct format
		}

		// Check if it starts with +82
		if (phone.startsWith('+82')) {
			return cleaned; // The cleaning already removed the +
		}

		// Assume it's a local Korean number
		// Remove leading 0 if present and add 82
		if (cleaned.startsWith('0')) {
			cleaned = cleaned.substring(1);
		}

		return '82' + cleaned;
	}

	/**
	 * Get user phone number from database
	 */
	private async getUserPhone(userId: string): Promise<string | null> {
		const { decrypt } = await import('$lib/server/encryption');

		const user = await db
			.select({ phone: users.phone })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		// Decrypt phone number before returning
		const encryptedPhone = user[0]?.phone || null;
		return encryptedPhone ? decrypt(encryptedPhone) : null;
	}

	/**
	 * Check if notification is duplicate (sent within last 5 minutes)
	 */
	private async isDuplicateNotification(
		phoneNumber: string,
		templateCode: string,
		templateData?: Record<string, string>
	): Promise<boolean> {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		const { and, gte } = await import('drizzle-orm');

		const recent = await db
			.select()
			.from(kakaoNotifications)
			.where(
				and(
					eq(kakaoNotifications.phoneNumber, phoneNumber),
					eq(kakaoNotifications.templateCode, templateCode),
					eq(kakaoNotifications.status, 'sent'),
					gte(kakaoNotifications.createdAt, fiveMinutesAgo)
				)
			)
			.limit(1);

		// If templateData exists, check if it matches
		if (recent.length > 0 && templateData) {
			return JSON.stringify(recent[0].templateData) === JSON.stringify(templateData);
		}

		return recent.length > 0;
	}

	/**
	 * Send SMS notification for international phone numbers
	 */
	private async sendSMSNotification(
		phoneNumber: string,
		templateName: string,
		templateData: TemplateData
	): Promise<{ success: boolean; messageId?: string; error?: string }> {
		console.log('============= SMS FALLBACK START =============');
		console.log('[SMS Fallback] Original phone:', phoneNumber);
		console.log('[SMS Fallback] Template:', templateName);
		console.log('[SMS Fallback] Template data:', templateData);
		
		try {
			// Convert Kakao template to SMS format
			const isDev = process.env.NODE_ENV !== 'production';
			let smsMessage = convertKakaoTemplateToSMS(templateName, templateData, isDev);
			console.log('[SMS Fallback] Converted message:', smsMessage);
			
			// Format the message for SMS
			smsMessage = formatSMSMessage(smsMessage);
			console.log('[SMS Fallback] Formatted message (length:', smsMessage.length, '):', smsMessage);
			
			// Format phone number for international SMS
			const formattedPhone = formatPhoneForInternationalSMS(phoneNumber);
			console.log('[SMS Fallback] Formatted phone:', formattedPhone);
			
			console.log('[SMS Fallback] Sending SMS to', formattedPhone);
			
			// Send SMS via Infobip
			const response = await infobipSMS.sendSMS({
				to: formattedPhone,
				text: smsMessage
			});
			
			// Check if SMS was sent successfully
			if (response.messages && response.messages.length > 0) {
				const message = response.messages[0];
				console.log('[SMS Fallback] Response message:', message);
				
				// Check status group (1 = Pending, 2 = Undeliverable, 3 = Delivered, etc.)
				if (message.status.groupId === 1 || message.status.groupId === 3) {
					console.log('[SMS Fallback] ✅ SUCCESS - SMS sent to', formattedPhone);
					console.log('[SMS Fallback] Message ID:', message.messageId);
					console.log('[SMS Fallback] Status:', message.status.name, '-', message.status.description);
					console.log('============= SMS FALLBACK SUCCESS =============');
					return {
						success: true,
						messageId: message.messageId
					};
				} else {
					console.error('[SMS Fallback] ❌ FAILED - SMS rejected for', formattedPhone);
					console.error('[SMS Fallback] Status:', message.status);
					console.error('[SMS Fallback] Group ID:', message.status.groupId);
					console.error('[SMS Fallback] Description:', message.status.description);
					console.log('============= SMS FALLBACK FAILED =============');
					return {
						success: false,
						error: `SMS failed: ${message.status.description}`
					};
				}
			}
			
			console.error('[SMS Fallback] ❌ No response from SMS service');
			console.log('============= SMS FALLBACK FAILED =============');
			return {
				success: false,
				error: 'No response from SMS service'
			};
		} catch (error) {
			console.error('[SMS Fallback] ❌ Exception:', error);
			console.error('[SMS Fallback] Error details:', error instanceof Error ? error.stack : error);
			console.log('============= SMS FALLBACK FAILED =============');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to send SMS'
			};
		}
	}

	/**
	 * Log notification to database
	 */
	private async logNotification(
		userId: string | undefined,
		phoneNumber: string,
		templateCode: string,
		templateData?: Record<string, string>,
		status: 'sent' | 'failed' = 'sent',
		messageId?: string,
		bulkId?: string,
		error?: string
	) {
		await db.insert(kakaoNotifications).values({
			userId,
			phoneNumber,
			templateCode,
			templateData,
			status,
			messageId,
			bulkId,
			errorMessage: error,
			sentAt: status === 'sent' ? new Date() : null,
			createdAt: new Date()
		});
	}

	/**
	 * Send Kakao AlimTalk notification
	 */
	async sendNotification(options: NotificationOptions): Promise<{
		success: boolean;
		messageId?: string;
		error?: string;
	}> {
		console.log('============= NOTIFICATION SERVICE START =============');
		console.log('[NotificationService] Input options:', {
			userId: options.userId,
			hasPhoneNumber: !!options.phoneNumber,
			phoneNumberLength: options.phoneNumber?.length,
			templateName: options.templateName,
			templateCode: options.templateCode,
			templateData: options.templateData,
			skipDuplicateCheck: options.skipDuplicateCheck
		});
		
		try {
			const { decrypt } = await import('$lib/server/encryption');

			// Determine which template to use
			let templateName: string;

			if (options.templateName) {
				// Use template name directly from templates.json
				templateName = options.templateName;
				console.log('[NotificationService] Using templateName:', templateName);
			} else if (options.templateCode) {
				// Legacy support - just use the code as-is
				templateName = options.templateCode;
				console.log('[NotificationService] Using legacy templateCode:', templateName);
			} else {
				console.error('[NotificationService] ❌ No template provided');
				console.log('============= NOTIFICATION SERVICE END =============');
				return {
					success: false,
					error: 'No template code or template name provided'
				};
			}

			// Get phone number
			let phoneNumber: string | null = options.phoneNumber || null;

			if (!phoneNumber && options.userId) {
				console.log('[NotificationService] No phone provided, fetching from userId:', options.userId);
				phoneNumber = await this.getUserPhone(options.userId);
				console.log('[NotificationService] Phone fetched from DB:', phoneNumber ? 'Found' : 'Not found');
			}

			if (!phoneNumber) {
				console.error('[NotificationService] ❌ No phone number available');
				console.log('============= NOTIFICATION SERVICE END =============');
				return {
					success: false,
					error: 'No phone number provided or found for user'
				};
			}
			
			console.log('[NotificationService] Phone number:', {
				length: phoneNumber.length,
				prefix: phoneNumber.substring(0, 4) + '***'
			});

			// Check if phone number is Korean
			const isKorean = this.isKoreanPhoneNumber(phoneNumber);
			console.log(`Phone number ${phoneNumber} is ${isKorean ? 'Korean' : 'International'}`);
			
			// For Korean numbers, format for Kakao AlimTalk
			let formattedPhone = '';
			if (isKorean) {
				formattedPhone = this.formatPhoneNumber(phoneNumber);
				
				// Validate Korean phone format
				const phoneRegex = /^82\d{9,11}$/;
				if (!phoneRegex.test(formattedPhone)) {
					return {
						success: false,
						error: `Invalid Korean phone number format: ${formattedPhone}`
					};
				}
			}

			// Decrypt template data if it contains personal information
			const decryptedTemplateData = { ...options.templateData };
			if (decryptedTemplateData) {
				// List of fields that might contain encrypted personal data
				const personalDataFields = ['NAME', 'name', '고객', '가이드', '가이드님', 'SHOPNAME'];

				for (const [key, value] of Object.entries(decryptedTemplateData)) {
					// Check if this field might contain personal data and needs decryption
					// Skip SHOPNAME as it's always '매치트립' and not encrypted
					if (value && typeof value === 'string' && key !== 'SHOPNAME' && value !== '매치트립') {
						// Check if the value looks encrypted (starts with 'ENC:')
						if (value.startsWith('ENC:')) {
							decryptedTemplateData[key] = decrypt(value) || value;
						}
					}
				}
			}

			// Validate template data
			console.log('[NotificationService] Validating template data for:', templateName);
			const validation = validateTemplateData(templateName, decryptedTemplateData);

			if (!validation.valid) {
				console.error('[NotificationService] ❌ Template validation failed');
				console.error('[NotificationService] Missing variables:', validation.missing);
				console.log('============= NOTIFICATION SERVICE END =============');
				return {
					success: false,
					error: `Missing template variables: ${validation.missing.join(', ')}`
				};
			}

			// Prepare template with environment-specific code
			console.log('[NotificationService] Preparing template...');
			const template = prepareTemplate(templateName, decryptedTemplateData);
			console.log('[NotificationService] Template prepared:', {
				templateCode: template.templateCode,
				hasText: !!template.text,
				textLength: template.text?.length,
				hasButton: !!template.button
			});

			// Check for duplicates unless skipped
			if (!options.skipDuplicateCheck) {
				// Use original phone for international, formatted for Korean
				const checkPhone = isKorean ? formattedPhone : phoneNumber;
				const isDuplicate = await this.isDuplicateNotification(
					checkPhone,
					template.templateCode,
					decryptedTemplateData
				);

				if (isDuplicate) {
					console.log(
						`Skipping duplicate notification: ${template.templateCode} to ${checkPhone}`
					);
					return {
						success: true,
						error: 'Duplicate notification skipped'
					};
				}
			}

			// Send notification based on phone type
			let result: any;
			let messageId: string | undefined;
			let bulkId: string | undefined;
			let notificationType: 'kakao' | 'sms' = 'kakao';
			
			if (isKorean) {
				// Send Kakao AlimTalk for Korean numbers
				result = await kakaoAlimTalk.sendAlimTalk({
					to: formattedPhone,
					templateCode: template.templateCode,
					text: template.text,
					buttons: template.button ? [template.button] : undefined
				});
				
				messageId = result.messages?.[0]?.messageId;
				bulkId = result.bulkId;
				
				console.log(`AlimTalk sent: ${template.templateCode} (${templateName}) to ${formattedPhone}`);
			} else {
				// Send SMS for international numbers
				notificationType = 'sms';
				const smsResult = await this.sendSMSNotification(
					phoneNumber,
					templateName,
					decryptedTemplateData
				);
				
				if (!smsResult.success) {
					throw new Error(smsResult.error || 'Failed to send SMS');
				}
				
				messageId = smsResult.messageId;
				console.log(`SMS sent: ${templateName} to ${phoneNumber}`);
			}

			// Log successful notification (use original phone for international, formatted for Korean)
			const logPhone = isKorean ? formattedPhone : phoneNumber;
			await this.logNotification(
				options.userId,
				logPhone,
				template.templateCode,
				decryptedTemplateData,
				'sent',
				messageId,
				bulkId
			);

			console.log('[NotificationService] ✅ Success - returning result');
			console.log('============= NOTIFICATION SERVICE END =============');
			return {
				success: true,
				messageId
			};
		} catch (error) {
			console.error('[NotificationService] ❌ Failed to send AlimTalk:', error);
			console.error('[NotificationService] Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : 'No stack'
			});

			// Log failed notification
			if (options.userId || options.phoneNumber) {
				// Get the actual template code that would have been used
				const actualCode = options.templateName
					? getTemplateCode(options.templateName)
					: options.templateCode || '';

				await this.logNotification(
					options.userId,
					options.phoneNumber ? this.formatPhoneNumber(options.phoneNumber) : '',
					actualCode,
					options.templateData,
					'failed',
					undefined,
					undefined,
					error instanceof Error ? error.message : 'Unknown error'
				);
			}

			console.log('============= NOTIFICATION SERVICE END (ERROR) =============');
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Failed to send notification'
			};
		}
	}

	/**
	 * Send bulk notifications
	 */
	async sendBulkNotifications(notifications: NotificationOptions[]): Promise<{
		sent: number;
		failed: number;
		results: Array<{ success: boolean; messageId?: string; error?: string }>;
	}> {
		const results = [];
		let sent = 0;
		let failed = 0;

		for (const notification of notifications) {
			const result = await this.sendNotification(notification);
			results.push(result);
			if (result.success) sent++;
			else failed++;
		}

		return { sent, failed, results };
	}

	/**
	 * Update notification status
	 */
	async updateNotificationStatus(
		messageId: string,
		status: 'delivered' | 'failed',
		error?: string
	) {
		await db
			.update(kakaoNotifications)
			.set({
				status,
				errorMessage: error,
				deliveredAt: status === 'delivered' ? new Date() : null
			})
			.where(eq(kakaoNotifications.messageId, messageId));
	}
}

// Export singleton instance
export const notificationService = new NotificationService();

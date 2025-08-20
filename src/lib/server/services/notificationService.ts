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
		
		const recent = await db
			.select()
			.from(notifications)
			.where(
				and(
					eq(notifications.phoneNumber, phoneNumber),
					eq(notifications.templateCode, templateCode),
					eq(notifications.status, 'sent'),
					gte(notifications.createdAt, fiveMinutesAgo)
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
		await db.insert(notifications).values({
			userId,
			phoneNumber,
			templateCode,
			templateData,
			status,
			messageId,
			bulkId,
			error,
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
		try {
			const { decrypt } = await import('$lib/server/encryption');
			
			// Determine which template to use
			let templateName: string;
			
			if (options.templateName) {
				// New way: Use template name (e.g., 'signup01')
				templateName = options.templateName;
			} else if (options.templateCode) {
				// Backward compatibility: Map hard-coded template codes to template names
				const templateCodeMap: Record<string, string> = {
					'testcode01': 'signup01',
					'testcode02': 'signup02',
					'testcode03': 'mytrip01',
					'testcode04': 'mytrip02',
					'testcode05': 'chat01',
					'testcode06': 'settlement01',
					'testcode07': 'remind01',
					'testcode08': 'cs01',
					'testcode09': 'myoffers01',
					'testcode10': 'chat02',
					'testcode11': 'myoffers02',
					'testcode12': 'remind02',
					'testcode13': 'rqcancel01',
					'testcode14': 'rqcancel02',
					'testcode15': 'rqcancel03',
					'testcode16': 'rqcancel04',
					'testcode17': 'cpcancel01',
					'testcode18': 'cpcancel02',
					'testcode19': 'cpcancel03',
					'testcode20': 'cpcancel04',
					// Production codes
					'code01': 'signup01',
					'code02': 'signup02',
					'code03': 'mytrip01',
					'code04': 'mytrip02',
					'code05': 'chat01',
					'code06': 'settlement01',
					'code07': 'remind01',
					'code08': 'cs01',
					'code09': 'myoffers01',
					'code10': 'chat02',
					'code11': 'myoffers02',
					'code12': 'remind02',
					'code13': 'rqcancel01',
					'code14': 'rqcancel02',
					'code15': 'rqcancel03',
					'code16': 'rqcancel04',
					'code17': 'cpcancel01',
					'code18': 'cpcancel02',
					'code19': 'cpcancel03',
					'code20': 'cpcancel04'
				};
				
				templateName = templateCodeMap[options.templateCode] || options.templateCode;
			} else {
				return {
					success: false,
					error: 'No template code or template name provided'
				};
			}

			// Get phone number
			let phoneNumber: string | null = options.phoneNumber || null;

			if (!phoneNumber && options.userId) {
				phoneNumber = await this.getUserPhone(options.userId);
			}

			if (!phoneNumber) {
				return {
					success: false,
					error: 'No phone number provided or found for user'
				};
			}

			// Format phone number
			const formattedPhone = this.formatPhoneNumber(phoneNumber);

			// Validate phone format
			const phoneRegex = /^82\d{9,11}$/;
			if (!phoneRegex.test(formattedPhone)) {
				return {
					success: false,
					error: `Invalid phone number format: ${formattedPhone}`
				};
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
			const validation = validateTemplateData(templateName, decryptedTemplateData);
			
			if (!validation.valid) {
				return {
					success: false,
					error: `Missing template variables: ${validation.missing.join(', ')}`
				};
			}
			
			// Prepare template with environment-specific code
			const template = prepareTemplate(templateName, decryptedTemplateData);

			// Check for duplicates unless skipped
			if (!options.skipDuplicateCheck) {
				const isDuplicate = await this.isDuplicateNotification(
					formattedPhone,
					template.templateCode,
					decryptedTemplateData
				);

				if (isDuplicate) {
					console.log(
						`Skipping duplicate notification: ${template.templateCode} to ${formattedPhone}`
					);
					return {
						success: true,
						error: 'Duplicate notification skipped'
					};
				}
			}

			// Send notification using the environment-specific template code
			const result = await kakaoAlimTalk.sendAlimTalk({
				to: formattedPhone,
				templateCode: template.templateCode,
				text: template.text,
				buttons: template.button ? [template.button] : undefined
			});

			// Get message ID from result
			const messageId = result.messages?.[0]?.messageId;
			const bulkId = result.bulkId;

			// Log successful notification
			await this.logNotification(
				options.userId,
				formattedPhone,
				template.templateCode,
				decryptedTemplateData,
				'sent',
				messageId,
				bulkId
			);

			console.log(`AlimTalk sent: ${template.templateCode} (${templateName}) to ${formattedPhone}`);

			return {
				success: true,
				messageId
			};
		} catch (error) {
			console.error('Failed to send AlimTalk:', error);

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
	async updateNotificationStatus(messageId: string, status: 'delivered' | 'failed', error?: string) {
		await db
			.update(notifications)
			.set({
				status,
				error,
				deliveredAt: status === 'delivered' ? new Date() : null,
				updatedAt: new Date()
			})
			.where(eq(notifications.messageId, messageId));
	}
}

// Export singleton instance
export const notificationService = new NotificationService();

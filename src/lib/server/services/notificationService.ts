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
		try {
			// Convert Kakao template to SMS format
			const isDev = process.env.NODE_ENV !== 'production';
			let smsMessage = convertKakaoTemplateToSMS(templateName, templateData, isDev);
			
			// Format the message for SMS
			smsMessage = formatSMSMessage(smsMessage);
			
			// Format phone number for international SMS
			const formattedPhone = formatPhoneForInternationalSMS(phoneNumber);
			
			console.log(`Sending SMS to ${formattedPhone}:`, smsMessage);
			
			// Send SMS via Infobip
			const response = await infobipSMS.sendSMS({
				to: formattedPhone,
				text: smsMessage
			});
			
			// Check if SMS was sent successfully
			if (response.messages && response.messages.length > 0) {
				const message = response.messages[0];
				
				// Check status group (1 = Pending, 2 = Undeliverable, 3 = Delivered, etc.)
				if (message.status.groupId === 1 || message.status.groupId === 3) {
					console.log(`SMS sent successfully to ${formattedPhone}. Message ID: ${message.messageId}`);
					return {
						success: true,
						messageId: message.messageId
					};
				} else {
					console.error(`SMS failed for ${formattedPhone}. Status:`, message.status);
					return {
						success: false,
						error: `SMS failed: ${message.status.description}`
					};
				}
			}
			
			return {
				success: false,
				error: 'No response from SMS service'
			};
		} catch (error) {
			console.error('Error sending SMS notification:', error);
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
		try {
			const { decrypt } = await import('$lib/server/encryption');

			// Determine which template to use
			let templateName: string;

			if (options.templateName) {
				// New way: Use template name (e.g., 'signup01')
				templateName = options.templateName;
			} else if (options.templateCode) {
				// Backward compatibility: Map hard-coded template codes to template names
				// Based on alimtalk_250825.csv data
				const templateCodeMap: Record<string, string> = {
					// Development codes (testcodeXX) - OLD ones still in use
					testcode02: 'signup02', // 가이드 회원가입
					testcode05: 'chat01', // 가이드 답변 도착
					testcode07: 'remind01', // 여행자 리마인더
					testcode08: 'cs01', // CS 문의 등록
					testcode10: 'chat02', // 여행자 문의 도착
					testcode11: 'myoffers02', // 제안 채택 알림
					testcode12: 'remind02', // 가이드 리마인더
					testcode13: 'rqcancel01', // 고객 취소요청 접수
					testcode14: 'rqcancel02', // 가이드에게 고객 취소요청 알림
					testcode15: 'rqcancel03', // 가이드 취소요청 접수
					testcode16: 'rqcancel04', // 고객에게 가이드 취소요청 알림
					testcode17: 'cpcancel01', // 고객 취소처리 완료
					testcode18: 'cpcancel02', // 가이드에게 고객 취소완료 알림
					testcode19: 'cpcancel03', // 가이드 취소처리 완료
					testcode20: 'cpcancel04', // 고객에게 가이드 취소완료 알림
					// New development codes replacing old ones
					testcode21: 'signup05', // 여행자 회원가입 (replaces testcode01)
					testcode23: 'mytrip05', // 여행 의뢰 등록 (replaces testcode03)
					testcode24: 'mytrip06', // 가이드 제안 도착 (replaces testcode04)
					testcode26: 'settlement03', // 결제 완료 (replaces testcode06)
					testcode29: 'myoffers05', // 가이드 제안 등록 (replaces testcode09)
					// Production codes (codeXX)
					code01: 'signup03', // 여행자 회원가입
					code02: 'signup04', // 가이드 회원가입
					code05: 'chat03', // 가이드 답변 도착
					code07: 'remind03', // 여행자 리마인더
					code08: 'cs02', // CS 문의 등록
					code10: 'chat04', // 여행자 문의 도착
					code11: 'myoffers04', // 제안 채택 알림
					code12: 'remind04', // 가이드 리마인더
					code13: 'rqcancel05', // 고객 취소요청 접수
					code14: 'rqcancel06', // 가이드에게 고객 취소요청 알림
					code15: 'rqcancel07', // 가이드 취소요청 접수
					code16: 'rqcancel08', // 고객에게 가이드 취소요청 알림
					code17: 'cpcancel05', // 고객 취소처리 완료
					code18: 'cpcancel06', // 가이드에게 고객 취소완료 알림
					code19: 'cpcancel07', // 가이드 취소처리 완료
					code20: 'cpcancel08', // 고객에게 가이드 취소완료 알림
					// New production codes
					code23: 'mytrip07', // 여행 의뢰 등록
					code24: 'mytrip08', // 가이드 제안 도착
					code26: 'settlement04', // 결제 완료
					code29: 'myoffers06' // 가이드 제안 등록
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

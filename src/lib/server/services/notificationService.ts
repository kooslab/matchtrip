import { db } from '$lib/server/db';
import { kakaoNotifications, users } from '$lib/server/db/schema';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import { prepareTemplate, validateTemplateData, type TemplateData } from '$lib/server/kakao/templateHelper';
import { eq } from 'drizzle-orm';

export interface NotificationOptions {
	userId?: string;
	phoneNumber?: string;
	templateCode: string;
	templateData: TemplateData;
	skipDuplicateCheck?: boolean;
}

export class NotificationService {
	constructor() {
		// No environment detection needed - templates will use PUBLIC_APP_URL
	}

	/**
	 * Format phone number to international format without +
	 * Handles various input formats
	 */
	private formatPhoneNumber(phone: string): string {
		// Remove all non-digit characters
		let cleaned = phone.replace(/\D/g, '');
		
		// If starts with 82 (Korea country code), use as is
		if (cleaned.startsWith('82')) {
			return cleaned;
		}
		
		// If starts with 0, remove it and add 82
		if (cleaned.startsWith('0')) {
			cleaned = cleaned.substring(1);
		}
		
		// Add Korean country code
		return '82' + cleaned;
	}

	/**
	 * Get user's phone number
	 */
	private async getUserPhone(userId: string): Promise<string | null> {
		const user = await db
			.select({ phone: users.phone })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);
		
		return user[0]?.phone || null;
	}

	/**
	 * Check if notification was recently sent to prevent duplicates
	 */
	private async isDuplicateNotification(
		phoneNumber: string,
		templateCode: string,
		templateData: TemplateData
	): Promise<boolean> {
		// Check if same notification was sent in last 5 minutes
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		
		const existing = await db
			.select({ id: kakaoNotifications.id })
			.from(kakaoNotifications)
			.where(eq(kakaoNotifications.phoneNumber, phoneNumber))
			.where(eq(kakaoNotifications.templateCode, templateCode))
			.where(eq(kakaoNotifications.status, 'sent'))
			.limit(1);
		
		// For now, simplified duplicate check
		// In production, you might want to check templateData too
		return existing.length > 0 && 
			   existing[0].createdAt > fiveMinutesAgo;
	}

	/**
	 * Log notification to database
	 */
	private async logNotification(
		userId: string | undefined,
		phoneNumber: string,
		templateCode: string,
		templateData: TemplateData,
		status: 'sent' | 'failed',
		messageId?: string,
		bulkId?: string,
		errorMessage?: string
	) {
		await db.insert(kakaoNotifications).values({
			userId,
			phoneNumber,
			templateCode,
			templateData,
			status,
			messageId,
			bulkId,
			errorMessage,
			sentAt: status === 'sent' ? new Date() : null
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
			
			// Validate template data
			const validation = validateTemplateData(
				options.templateCode,
				options.templateData
			);
			
			if (!validation.valid) {
				return { 
					success: false, 
					error: `Missing template variables: ${validation.missing.join(', ')}` 
				};
			}
			
			// Check for duplicates unless skipped
			if (!options.skipDuplicateCheck) {
				const isDuplicate = await this.isDuplicateNotification(
					formattedPhone,
					options.templateCode,
					options.templateData
				);
				
				if (isDuplicate) {
					console.log(`Skipping duplicate notification: ${options.templateCode} to ${formattedPhone}`);
					return { 
						success: true, 
						error: 'Duplicate notification skipped' 
					};
				}
			}
			
			// Prepare template
			const template = prepareTemplate(
				options.templateCode,
				options.templateData
			);
			
			// Send notification
			const result = await kakaoAlimTalk.sendAlimTalk({
				to: formattedPhone,
				templateCode: options.templateCode,
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
				options.templateCode,
				options.templateData,
				'sent',
				messageId,
				bulkId
			);
			
			console.log(`AlimTalk sent: ${options.templateCode} to ${formattedPhone}`);
			
			return { 
				success: true, 
				messageId 
			};
			
		} catch (error) {
			console.error('Failed to send AlimTalk:', error);
			
			// Log failed notification
			if (options.userId || options.phoneNumber) {
				await this.logNotification(
					options.userId,
					options.phoneNumber ? this.formatPhoneNumber(options.phoneNumber) : '',
					options.templateCode,
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
	async sendBulkNotifications(
		notifications: NotificationOptions[]
	): Promise<Array<{ success: boolean; messageId?: string; error?: string }>> {
		// Process notifications sequentially to avoid rate limiting
		const results = [];
		
		for (const notification of notifications) {
			const result = await this.sendNotification(notification);
			results.push(result);
			
			// Add small delay between messages to avoid rate limiting
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		return results;
	}

	/**
	 * Update notification status (e.g., from webhook)
	 */
	async updateNotificationStatus(
		messageId: string,
		status: 'delivered' | 'failed',
		errorMessage?: string
	) {
		await db
			.update(kakaoNotifications)
			.set({
				status,
				deliveredAt: status === 'delivered' ? new Date() : null,
				errorMessage
			})
			.where(eq(kakaoNotifications.messageId, messageId));
	}
}

// Export singleton instance
export const notificationService = new NotificationService();
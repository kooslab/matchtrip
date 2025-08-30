import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationService } from '$lib/server/services/notificationService';
import { convertKakaoTemplateToEmail } from '$lib/server/email/emailTemplateConverter';
import { sendEmail } from '$lib/server/email/emailService';

/**
 * Test endpoint for email notifications (replaces SMS)
 * 
 * Usage:
 * - ?type=notification&email=test@example.com&template=signup01 - Test full notification flow
 * - ?type=template&template=signup01 - Test template conversion only
 * - ?type=direct&email=test@example.com - Send direct test email
 */
export const GET: RequestHandler = async ({ url }) => {
	const type = url.searchParams.get('type') || 'notification';
	const email = url.searchParams.get('email');
	const templateName = url.searchParams.get('template') || 'signup01';
	
	try {
		if (type === 'notification') {
			// Test full notification flow with email fallback
			if (!email) {
				return json({ 
					error: 'Email address is required for notification test',
					usage: 'Add ?email=test@example.com to the URL'
				}, { status: 400 });
			}
			
			// Simulate an international phone number to trigger email fallback
			const internationalPhone = '+1234567890'; // Non-Korean number
			
			const templateData = {
				SHOPNAME: '매치트립',
				NAME: 'Test User',
				고객: 'Test Customer',
				가이드: 'Test Guide',
				가이드님: 'Test Guide',
				나의여행: 'my-trips',
				나의제안: 'my-offers',
				메세지확인하기: 'chat',
				주문내역: 'settlement'
			};
			
			console.log('Testing email notification:', {
				email,
				templateName,
				templateData
			});
			
			// This will detect the international number and send email instead
			const result = await notificationService.sendNotification({
				phoneNumber: internationalPhone,
				userId: 'test-user-id', // This would normally fetch the email from DB
				templateName,
				templateData,
				skipDuplicateCheck: true
			});
			
			return json({
				success: true,
				message: 'Email notification test initiated',
				result,
				details: {
					type: 'notification',
					email,
					templateName,
					templateData
				}
			});
			
		} else if (type === 'template') {
			// Test template conversion only
			const templateData = {
				SHOPNAME: '매치트립',
				NAME: 'Test User',
				고객: 'Test Customer',
				가이드: 'Test Guide',
				가이드님: 'Test Guide',
				나의여행: 'my-trips',
				나의제안: 'my-offers',
				메세지확인하기: 'chat',
				주문내역: 'settlement'
			};
			
			const isDev = process.env.NODE_ENV !== 'production';
			const emailContent = convertKakaoTemplateToEmail(templateName, templateData, isDev);
			
			return json({
				success: true,
				message: 'Template converted to email format',
				result: {
					subject: emailContent.subject,
					htmlLength: emailContent.html.length,
					textLength: emailContent.text.length,
					preview: {
						text: emailContent.text.substring(0, 200) + '...'
					}
				},
				details: {
					type: 'template',
					templateName,
					templateData,
					isDev
				}
			});
			
		} else if (type === 'direct') {
			// Send a direct test email
			if (!email) {
				return json({ 
					error: 'Email address is required for direct test',
					usage: 'Add ?email=test@example.com to the URL'
				}, { status: 400 });
			}
			
			const result = await sendEmail({
				to: email,
				subject: '🧪 MatchTrip Email Test',
				html: `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
						<h1 style="color: #1095f4;">MatchTrip Email Test</h1>
						<p>This is a test email from the MatchTrip notification system.</p>
						<p>If you received this email, the email service is working correctly!</p>
						<hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
						<p style="color: #6b7280; font-size: 14px;">
							Test initiated at: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
						</p>
					</div>
				`,
				text: `MatchTrip Email Test

This is a test email from the MatchTrip notification system.
If you received this email, the email service is working correctly!

Test initiated at: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
			});
			
			return json({
				success: true,
				message: 'Test email sent successfully',
				result,
				details: {
					type: 'direct',
					to: email,
					timestamp: new Date().toISOString()
				}
			});
		}
		
		return json({ 
			error: 'Invalid test type',
			validTypes: ['notification', 'template', 'direct']
		}, { status: 400 });
		
	} catch (error) {
		console.error('Test email error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to test email',
			stack: error instanceof Error ? error.stack : undefined
		}, { status: 500 });
	}
};
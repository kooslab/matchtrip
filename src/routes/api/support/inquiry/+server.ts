import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { notificationService } from '$lib/server/services/notificationService';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;
		if (!session) {
			return json({ error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const { subject, content, category } = await request.json();

		// Validate input
		if (!subject || !content) {
			return json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 });
		}

		// Get user details
		const userDetails = await db
			.select({ name: users.name, phone: users.phone, email: users.email })
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		if (!userDetails[0]) {
			return json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
		}

		// TODO: In production, you would save the inquiry to a support_inquiries table
		// For now, we'll just log it and send the notification
		console.log('[SUPPORT API] New inquiry received:', {
			userId: session.user.id,
			subject,
			category,
			content: content.substring(0, 100) + '...'
		});

		// Send CS inquiry notification (testcode08)
		if (userDetails[0].phone) {
			try {
				console.log('[SUPPORT API] Sending CS inquiry AlimTalk notification');
				await notificationService.sendNotification({
					userId: session.user.id,
					phoneNumber: userDetails[0].phone,
					templateCode: 'testcode08',
					templateData: {
						SHOPNAME: '매치트립',
						NAME: userDetails[0].name || '고객'
					}
				});
				console.log('[SUPPORT API] AlimTalk notification sent successfully');
			} catch (notificationError) {
				console.error('[SUPPORT API] Failed to send AlimTalk notification:', notificationError);
			}
		}

		// TODO: Send email notification to support team
		// This would typically send an email to the support team with the inquiry details

		return json({
			success: true,
			message: '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.'
		});
	} catch (error) {
		console.error('Error submitting support inquiry:', error);
		return json({ error: '문의 접수 중 오류가 발생했습니다.' }, { status: 500 });
	}
};
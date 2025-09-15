import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { notificationService } from '$lib/server/services/notificationService';
import { decrypt } from '$lib/server/encryption';
import { sendEmail } from '$lib/server/email/emailService';
import { env } from '$env/dynamic/private';

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
				const decryptedPhone = decrypt(userDetails[0].phone);
				const decryptedName = userDetails[0].name ? decrypt(userDetails[0].name) : null;

				await notificationService.sendNotification({
					userId: session.user.id,
					phoneNumber: decryptedPhone,
					templateName: 'cs01',
					templateData: {
						SHOPNAME: '매치트립',
						NAME: decryptedName || '고객'
					}
				});
				console.log('[SUPPORT API] AlimTalk notification sent successfully');
			} catch (notificationError) {
				console.error('[SUPPORT API] Failed to send AlimTalk notification:', notificationError);
			}
		}

		// Send email notification to support team
		try {
			const decryptedEmail = userDetails[0].email ? decrypt(userDetails[0].email) : null;
			const decryptedName = userDetails[0].name ? decrypt(userDetails[0].name) : null;
			
			// Only send email if the user is a traveler
			if (session.user.role === 'traveler') {
				const emailHtml = `
					<h2>새로운 여행자 문의가 접수되었습니다</h2>
					<hr>
					<h3>문의자 정보</h3>
					<ul>
						<li><strong>이름:</strong> ${decryptedName || '알 수 없음'}</li>
						<li><strong>이메일:</strong> ${decryptedEmail || '알 수 없음'}</li>
						<li><strong>사용자 ID:</strong> ${session.user.id}</li>
						<li><strong>역할:</strong> 여행자</li>
					</ul>
					<hr>
					<h3>문의 내용</h3>
					<p><strong>카테고리:</strong> ${category || '일반 문의'}</p>
					<p><strong>제목:</strong> ${subject}</p>
					<p><strong>내용:</strong></p>
					<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${content}</div>
					<hr>
					<p style="color: #666; font-size: 12px;">접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
				`;

				const emailText = `
새로운 여행자 문의가 접수되었습니다

문의자 정보:
- 이름: ${decryptedName || '알 수 없음'}
- 이메일: ${decryptedEmail || '알 수 없음'}
- 사용자 ID: ${session.user.id}
- 역할: 여행자

문의 내용:
카테고리: ${category || '일반 문의'}
제목: ${subject}
내용:
${content}

접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
				`;

				await sendEmail({
					to: ['help@agentt.kr', 'johnnykoo@kooslab.net'],
					subject: `[매치트립 여행자 문의] ${subject}`,
					html: emailHtml,
					text: emailText
				});
				
				console.log('[SUPPORT API] Email notification sent to help@agentt.kr and johnnykoo@kooslab.net');
			}
		} catch (emailError) {
			console.error('[SUPPORT API] Failed to send email notification:', emailError);
			// Don't fail the whole request if email fails
		}

		return json({
			success: true,
			message: '문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.'
		});
	} catch (error) {
		console.error('Error submitting support inquiry:', error);
		return json({ error: '문의 접수 중 오류가 발생했습니다.' }, { status: 500 });
	}
};

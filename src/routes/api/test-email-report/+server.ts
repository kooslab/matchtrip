import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email/emailService';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async () => {
	// Check if we're in development mode
	const isDev = !env.NODE_ENV || env.NODE_ENV !== 'production';
	
	if (!isDev) {
		return json({ error: 'Test endpoint only available in development' }, { status: 403 });
	}

	try {
		// Test email data
		const testSubject = '테스트 문의입니다';
		const testContent = '이것은 이메일 알림 시스템이 제대로 작동하는지 확인하기 위한 테스트 메시지입니다.';
		const testCategory = '일반 문의';
		
		const emailHtml = `
			<h2>새로운 여행자 문의가 접수되었습니다</h2>
			<hr>
			<h3>문의자 정보</h3>
			<ul>
				<li><strong>이름:</strong> 테스트 사용자</li>
				<li><strong>이메일:</strong> test@example.com</li>
				<li><strong>사용자 ID:</strong> test-user-123</li>
				<li><strong>역할:</strong> 여행자</li>
			</ul>
			<hr>
			<h3>문의 내용</h3>
			<p><strong>카테고리:</strong> ${testCategory}</p>
			<p><strong>제목:</strong> ${testSubject}</p>
			<p><strong>내용:</strong></p>
			<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${testContent}</div>
			<hr>
			<p style="color: #666; font-size: 12px;">접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
		`;

		const emailText = `
새로운 여행자 문의가 접수되었습니다

문의자 정보:
- 이름: 테스트 사용자
- 이메일: test@example.com
- 사용자 ID: test-user-123
- 역할: 여행자

문의 내용:
카테고리: ${testCategory}
제목: ${testSubject}
내용:
${testContent}

접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
		`;

		await sendEmail({
			to: 'help@agentt.kr',
			subject: `[매치트립 여행자 문의] ${testSubject}`,
			html: emailHtml,
			text: emailText
		});
		
		return json({ 
			success: true, 
			message: 'Test email sent successfully to help@agentt.kr',
			details: {
				to: 'help@agentt.kr',
				subject: `[매치트립 여행자 문의] ${testSubject}`,
				timestamp: new Date().toISOString()
			}
		});
	} catch (error) {
		console.error('Test email error:', error);
		return json({ 
			error: 'Failed to send test email', 
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
};
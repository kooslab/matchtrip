import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reports, users } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendEmail } from '$lib/server/email/emailService';
import { decrypt } from '$lib/server/encryption';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		const session = locals.session;
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const reporterId = session.user.id;
		const body = await request.json();

		const {
			reportedUserId,
			conversationId,
			productConversationId,
			productId,
			offerId,
			reportType,
			description
		} = body;

		// Validate required fields
		if (!reportedUserId || !reportType) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Prevent self-reporting
		if (reporterId === reportedUserId) {
			return json({ error: 'Cannot report yourself' }, { status: 400 });
		}

		// Create the report
		const [report] = await db
			.insert(reports)
			.values({
				reporterId,
				reportedUserId,
				conversationId,
				productConversationId,
				productId,
				offerId,
				reportType,
				description,
				status: 'pending'
			})
			.returning();

		// Send email notification if reporter is a traveler
		if (session.user.role === 'traveler') {
			try {
				// Get reporter and reported user details
				const [reporter, reportedUser] = await Promise.all([
					db.select().from(users).where(eq(users.id, reporterId)).limit(1),
					db.select().from(users).where(eq(users.id, reportedUserId)).limit(1)
				]);

				if (reporter[0] && reportedUser[0]) {
					const decryptedReporterName = reporter[0].name ? decrypt(reporter[0].name) : '알 수 없음';
					const decryptedReporterEmail = reporter[0].email;
					const decryptedReportedName = reportedUser[0].name ? decrypt(reportedUser[0].name) : '알 수 없음';
					const decryptedReportedEmail = reportedUser[0].email;

					// Map report type to Korean
					const reportTypeMap: Record<string, string> = {
						scam: '사기 의심',
						inappropriate_ads: '부적절한 광고',
						fraud: '직거래 강요',
						harassment: '욕설/비속어 사용',
						contact_info_leak: '연락 두절'
					};

					const reportTypeKorean = reportTypeMap[reportType] || reportType;

					const emailHtml = `
						<h2>새로운 여행자 신고가 접수되었습니다</h2>
						<hr>
						<h3>신고자 정보</h3>
						<ul>
							<li><strong>이름:</strong> ${decryptedReporterName}</li>
							<li><strong>이메일:</strong> ${decryptedReporterEmail}</li>
							<li><strong>사용자 ID:</strong> ${reporterId}</li>
							<li><strong>역할:</strong> 여행자</li>
						</ul>
						<hr>
						<h3>피신고자 정보</h3>
						<ul>
							<li><strong>이름:</strong> ${decryptedReportedName}</li>
							<li><strong>이메일:</strong> ${decryptedReportedEmail}</li>
							<li><strong>사용자 ID:</strong> ${reportedUserId}</li>
							<li><strong>역할:</strong> ${reportedUser[0].role}</li>
						</ul>
						<hr>
						<h3>신고 내용</h3>
						<p><strong>신고 유형:</strong> ${reportTypeKorean}</p>
						${description ? `<p><strong>상세 내용:</strong></p>
						<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${description}</div>` : ''}
						<p><strong>관련 정보:</strong></p>
						<ul>
							${productId ? `<li>상품 ID: ${productId}</li>` : ''}
							${productConversationId ? `<li>상품 대화 ID: ${productConversationId}</li>` : ''}
							${conversationId ? `<li>대화 ID: ${conversationId}</li>` : ''}
							${offerId ? `<li>제안 ID: ${offerId}</li>` : ''}
						</ul>
						<hr>
						<p style="color: #666; font-size: 12px;">신고 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
					`;

					const emailText = `
새로운 여행자 신고가 접수되었습니다

신고자 정보:
- 이름: ${decryptedReporterName}
- 이메일: ${decryptedReporterEmail}
- 사용자 ID: ${reporterId}
- 역할: 여행자

피신고자 정보:
- 이름: ${decryptedReportedName}
- 이메일: ${decryptedReportedEmail}
- 사용자 ID: ${reportedUserId}
- 역할: ${reportedUser[0].role}

신고 내용:
신고 유형: ${reportTypeKorean}
${description ? `상세 내용:\n${description}` : ''}

관련 정보:
${productId ? `- 상품 ID: ${productId}` : ''}
${productConversationId ? `- 상품 대화 ID: ${productConversationId}` : ''}
${conversationId ? `- 대화 ID: ${conversationId}` : ''}
${offerId ? `- 제안 ID: ${offerId}` : ''}

신고 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
					`;

					await sendEmail({
						to: ['help@agentt.kr', 'johnnykoo@kooslab.net'],
						subject: `[매치트립 신고] ${reportTypeKorean} - ${decryptedReportedName}`,
						html: emailHtml,
						text: emailText
					});

					console.log('[REPORTS API] Email notification sent to help@agentt.kr and johnnykoo@kooslab.net');
				}
			} catch (emailError) {
				console.error('[REPORTS API] Failed to send email notification:', emailError);
				// Don't fail the whole request if email fails
			}
		}

		return json({ success: true, report }, { status: 201 });
	} catch (error) {
		console.error('Failed to create report:', error);
		// Return more detailed error for debugging
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		return json({ 
			error: 'Failed to create report',
			details: errorMessage 
		}, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		const session = locals.session;
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user's reports
		const userReports = await db
			.select()
			.from(reports)
			.where(eq(reports.reporterId, session.user.id))
			.orderBy(desc(reports.createdAt));

		return json({ reports: userReports });
	} catch (error) {
		console.error('Failed to fetch reports:', error);
		return json({ error: 'Failed to fetch reports' }, { status: 500 });
	}
};
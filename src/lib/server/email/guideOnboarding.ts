import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const RESEND_API_KEY = env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = env.RESEND_FROM_EMAIL;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface GuideOnboardingEmailData {
	guideName: string;
	guideEmail: string;
	submittedAt: Date;
}

export function generateGuideOnboardingEmail(data: GuideOnboardingEmailData) {
	const subject = `${data.guideName}님, 가이드 신청이 접수되었습니다`;

	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>${subject}</title>
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
					line-height: 1.6;
					color: #333;
					max-width: 600px;
					margin: 0 auto;
					padding: 20px;
					background-color: #f5f5f5;
				}
				.container {
					background-color: white;
					border-radius: 12px;
					box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
					overflow: hidden;
				}
				.header {
					background: linear-gradient(135deg, #1095f4 0%, #0e7fcf 100%);
					color: white;
					padding: 40px 30px;
					text-align: center;
				}
				.logo {
					font-size: 32px;
					font-weight: bold;
					margin-bottom: 10px;
				}
				.content {
					padding: 40px 30px;
				}
				.status-badge {
					display: inline-block;
					padding: 8px 16px;
					background-color: #fef3c7;
					color: #92400e;
					border-radius: 20px;
					font-size: 14px;
					font-weight: 500;
					margin-bottom: 20px;
				}
				.info-box {
					background-color: #f0f9ff;
					border-left: 4px solid #1095f4;
					padding: 20px;
					margin: 30px 0;
					border-radius: 4px;
				}
				.timeline {
					margin: 30px 0;
				}
				.timeline-item {
					display: flex;
					align-items: flex-start;
					margin-bottom: 20px;
				}
				.timeline-marker {
					width: 40px;
					height: 40px;
					border-radius: 50%;
					display: flex;
					align-items: center;
					justify-content: center;
					flex-shrink: 0;
					margin-right: 15px;
				}
				.timeline-marker.completed {
					background-color: #10b981;
					color: white;
				}
				.timeline-marker.pending {
					background-color: #fbbf24;
					color: white;
				}
				.timeline-marker.future {
					background-color: #e5e7eb;
					color: #9ca3af;
				}
				.timeline-content h3 {
					margin: 0 0 5px 0;
					font-size: 16px;
					font-weight: 600;
				}
				.timeline-content p {
					margin: 0;
					color: #6b7280;
					font-size: 14px;
				}
				.button {
					display: inline-block;
					padding: 14px 28px;
					background-color: #1095f4;
					color: white;
					text-decoration: none;
					border-radius: 8px;
					font-weight: 600;
					margin: 20px 0;
					text-align: center;
				}
				.footer {
					background-color: #f9fafb;
					padding: 30px;
					text-align: center;
					font-size: 14px;
					color: #6b7280;
				}
				.footer a {
					color: #1095f4;
					text-decoration: none;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<div class="logo">MatchTrip</div>
					<p style="margin: 0; opacity: 0.9;">가이드 파트너 프로그램</p>
				</div>
				
				<div class="content">
					<div class="status-badge">승인 검토 중</div>
					
					<h1 style="margin-top: 0;">안녕하세요 ${data.guideName}님! 👋</h1>
					
					<p>MatchTrip 가이드 신청이 성공적으로 접수되었습니다. 저희와 함께 특별한 여행 경험을 만들어주실 가이드가 되어주셔서 감사합니다.</p>
					
					<div class="info-box">
						<strong>📋 제출하신 정보</strong><br>
						• 신청일시: ${data.submittedAt.toLocaleDateString('ko-KR')} ${data.submittedAt.toLocaleTimeString('ko-KR')}<br>
						• 이메일: ${data.guideEmail}<br>
						• 상태: 관리자 검토 대기 중
					</div>
					
					<h2>승인 절차 안내</h2>
					
					<div class="timeline">
						<div class="timeline-item">
							<div class="timeline-marker completed">✓</div>
							<div class="timeline-content">
								<h3>프로필 제출 완료</h3>
								<p>가이드 프로필과 서류가 성공적으로 제출되었습니다</p>
							</div>
						</div>
						
						<div class="timeline-item">
							<div class="timeline-marker pending">2</div>
							<div class="timeline-content">
								<h3>관리자 검토 (24-48시간)</h3>
								<p>제출하신 정보와 서류를 꼼꼼히 검토하고 있습니다</p>
							</div>
						</div>
						
						<div class="timeline-item">
							<div class="timeline-marker future">3</div>
							<div class="timeline-content">
								<h3>승인 완료</h3>
								<p>승인 완료 시 이메일로 알려드리며, 바로 활동을 시작하실 수 있습니다</p>
							</div>
						</div>
					</div>
					
					<h2>승인 후 가능한 활동</h2>
					<ul style="color: #4b5563;">
						<li>여행자들의 여행 요청 확인</li>
						<li>맞춤형 여행 제안서 작성</li>
						<li>여행자와 직접 소통</li>
						<li>가이드 투어 진행 및 수익 창출</li>
					</ul>
					
					<div style="text-align: center; margin: 40px 0;">
						<a href="${process.env.PUBLIC_BASE_URL || 'https://matchtrip.net'}/guide/pending-approval" class="button">
							승인 상태 확인하기
						</a>
					</div>
					
					<p style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 14px;">
						💡 <strong>알려드립니다:</strong> 검토 과정에서 추가 정보가 필요한 경우 이메일로 연락드릴 수 있습니다. 
						제출하신 연락처 정보가 정확한지 확인해 주세요.
					</p>
				</div>
				
				<div class="footer">
					<p>이 이메일은 MatchTrip 가이드 신청과 관련하여 발송되었습니다.</p>
					<p>문의사항이 있으시면 <a href="mailto:support@matchtrip.net">support@matchtrip.net</a>으로 연락주세요.</p>
					<p style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
						© 2024 MatchTrip. All rights reserved.
					</p>
				</div>
			</div>
		</body>
		</html>
	`;

	const textContent = `
${subject}

안녕하세요 ${data.guideName}님!

MatchTrip 가이드 신청이 성공적으로 접수되었습니다. 저희와 함께 특별한 여행 경험을 만들어주실 가이드가 되어주셔서 감사합니다.

제출하신 정보:
- 신청일시: ${data.submittedAt.toLocaleDateString('ko-KR')} ${data.submittedAt.toLocaleTimeString('ko-KR')}
- 이메일: ${data.guideEmail}
- 상태: 관리자 검토 대기 중

승인 절차 안내:
1. 프로필 제출 완료 ✓
2. 관리자 검토 (24-48시간) - 진행 중
3. 승인 완료 - 대기 중

승인 후 가능한 활동:
- 여행자들의 여행 요청 확인
- 맞춤형 여행 제안서 작성
- 여행자와 직접 소통
- 가이드 투어 진행 및 수익 창출

승인 상태 확인하기:
${process.env.PUBLIC_BASE_URL || 'https://matchtrip.net'}/guide/pending-approval

알려드립니다: 검토 과정에서 추가 정보가 필요한 경우 이메일로 연락드릴 수 있습니다. 제출하신 연락처 정보가 정확한지 확인해 주세요.

문의사항이 있으시면 support@matchtrip.net으로 연락주세요.

감사합니다.
MatchTrip 팀 드림
	`;

	return {
		to: data.guideEmail,
		subject,
		html: htmlContent,
		text: textContent
	};
}

export async function sendGuideOnboardingEmail(data: GuideOnboardingEmailData) {
	try {
		const emailData = generateGuideOnboardingEmail(data);

		if (!resend || !RESEND_API_KEY) {
			// Development mode - just log the email
			console.log('\n=== GUIDE ONBOARDING EMAIL (Development Mode) ===');
			console.log('To:', emailData.to);
			console.log('Subject:', emailData.subject);
			console.log(
				'Preview URL:',
				`${process.env.PUBLIC_BASE_URL || 'https://matchtrip.net'}/guide/pending-approval`
			);
			console.log('\n--- Email Content Preview ---');
			console.log(emailData.text.substring(0, 500) + '...');
			console.log('=== END EMAIL ===\n');

			return { success: true, id: 'dev-mode-' + Date.now() };
		}

		const result = await resend.emails.send({
			from: RESEND_FROM_EMAIL || 'MatchTrip <noreply@matchtrip.net>',
			to: emailData.to,
			subject: emailData.subject,
			html: emailData.html,
			text: emailData.text
		});

		console.log('Guide onboarding email sent:', {
			to: emailData.to,
			subject: emailData.subject,
			id: result.data?.id
		});

		return { success: true, id: result.data?.id };
	} catch (error) {
		console.error('Failed to send guide onboarding email:', error);
		return { success: false, error };
	}
}

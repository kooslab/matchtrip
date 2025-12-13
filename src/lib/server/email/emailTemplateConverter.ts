import templates from '$lib/server/kakao/templates.json';
import type { TemplateData } from '$lib/server/kakao/templateHelper';

/**
 * Convert Kakao AlimTalk template to HTML email format
 */
export function convertKakaoTemplateToEmail(
	templateName: string,
	templateData: TemplateData,
	isDev: boolean = process.env.NODE_ENV !== 'production'
): { html: string; text: string; subject: string } {
	// Get template from templates.json - look in both dev and prod sections
	const templateSource = isDev ? templates.dev : templates.prod;
	
	// Find template by name property
	let template: any = null;
	for (const [key, tmpl] of Object.entries(templateSource || {})) {
		if ((tmpl as any).name === templateName) {
			template = tmpl;
			break;
		}
	}
	
	if (!template) {
		throw new Error(`Template ${templateName} not found in ${isDev ? 'dev' : 'prod'} templates`);
	}
	
	// Process template text with variable replacement
	let processedText = template.text;
	for (const [key, value] of Object.entries(templateData)) {
		const placeholder = `#{${key}}`;
		processedText = processedText.replace(new RegExp(placeholder, 'g'), value);
	}
	
	// Get button URL if exists
	let buttonHtml = '';
	let buttonText = '';
	if (template.button) {
		// Button URLs are directly on the button object, not nested in dev/prod
		const buttonUrl = template.button.urlMobile || template.button.urlPc;
		
		if (buttonUrl) {
			buttonHtml = `
				<tr>
					<td align="center" style="padding: 30px 0;">
						<a href="${buttonUrl}" style="display: inline-block; padding: 14px 32px; background-color: #1095f4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
							${template.button.name}
						</a>
					</td>
				</tr>
			`;
			buttonText = `\n\n${template.button.name}: ${buttonUrl}`;
		}
	}
	
	// Generate subject based on template type
	const subject = generateEmailSubject(templateName, templateData);
	
	// Create HTML email
	const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${subject}</title>
	<!--[if mso]>
	<noscript>
		<xml>
			<o:OfficeDocumentSettings>
				<o:PixelsPerInch>96</o:PixelsPerInch>
			</o:OfficeDocumentSettings>
		</xml>
	</noscript>
	<![endif]-->
	<style>
		@media only screen and (max-width: 600px) {
			.container { width: 100% !important; }
			.content { padding: 20px !important; }
		}
	</style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
	<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<table class="container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
					<!-- Header -->
					<tr>
						<td style="background: linear-gradient(135deg, #1095f4 0%, #0e7fcf 100%); padding: 30px; text-align: center;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">MatchTrip</h1>
							<p style="margin: 8px 0 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">여행을 더 특별하게</p>
						</td>
					</tr>
					
					<!-- Content -->
					<tr>
						<td class="content" style="padding: 40px 30px;">
							<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
								<tr>
									<td style="font-size: 16px; line-height: 1.6; color: #333333;">
										${formatEmailContent(processedText)}
									</td>
								</tr>
								${buttonHtml}
							</table>
						</td>
					</tr>
					
					<!-- Footer -->
					<tr>
						<td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">
								이 이메일은 MatchTrip 서비스 알림입니다.
							</p>
							<p style="margin: 0; font-size: 12px; color: #9ca3af;">
								© ${new Date().getFullYear()} MatchTrip. All rights reserved.
							</p>
							<p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
								문의: support@matchtrip.net
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;
	
	// Create plain text version
	const text = processedText + buttonText + `

---
이 이메일은 MatchTrip 서비스 알림입니다.
© ${new Date().getFullYear()} MatchTrip. All rights reserved.
문의: support@matchtrip.net
`;
	
	return { html, text, subject };
}

/**
 * Format email content with proper HTML structure
 */
function formatEmailContent(text: string): string {
	// Convert line breaks to HTML
	const lines = text.split('\n').filter(line => line.trim());
	
	// Wrap each line in a paragraph tag
	return lines.map(line => `<p style="margin: 0 0 15px 0;">${line}</p>`).join('');
}

/**
 * Generate email subject based on template type
 */
function generateEmailSubject(templateName: string, templateData: TemplateData): string {
	const subjectMap: Record<string, string> = {
		// Signup
		'signup01': `🎉 ${templateData.NAME || '고객'}님, MatchTrip 가입을 환영합니다!`,
		'signup02': `🎉 ${templateData.NAME || '가이드'}님, MatchTrip 가이드 가입을 환영합니다!`,
		
		// Trip
		'mytrip01': `✈️ ${templateData.NAME || '고객'}님의 여행 의뢰가 등록되었습니다`,
		'mytrip02': `📬 새로운 여행 제안이 도착했습니다`,
		
		// Offers
		'myoffers01': `📝 ${templateData.가이드님 || '가이드'}님의 제안이 등록되었습니다`,
		'myoffers02': `🎯 ${templateData.고객 || '고객'}님의 새로운 여행 의뢰가 있습니다`,
		
		// Chat
		'chat01': `💬 새로운 메시지가 도착했습니다`,
		'chat02': `💬 ${templateData.고객 || '고객'}님의 문의가 있습니다`,
		
		// Payment
		'settlement01': `💳 결제가 완료되었습니다`,
		'settlement02': `💰 ${templateData.고객 || '고객'}님의 결제가 완료되었습니다`,
		
		// Reminders
		'remind01': `⏰ ${templateData.NAME || '고객'}님의 여행이 곧 시작됩니다`,
		'remind02': `⏰ ${templateData.NAME || '고객'}님과의 여행이 곧 시작됩니다`,
		
		// CS
		'cs01': `📨 문의가 접수되었습니다`,
		
		// Offer status
		'offeraccept01': `✅ 제안이 수락되었습니다`,
		
		// Cancellations
		'cancel01': `🔴 ${templateData.고객 || '고객'}님이 취소를 요청했습니다`,
		'cancel02': `🔴 취소 요청이 접수되었습니다`,
		'cancel03': `🔴 ${templateData.가이드 || '가이드'}님이 취소를 요청했습니다`,
		'cancel04': `🔴 가이드가 취소를 요청했습니다`,
		'cpcancel01': `✅ 취소가 완료되었습니다`,
		'cpcancel02': `✅ ${templateData.고객 || '고객'}님의 취소가 완료되었습니다`,
		'cpcancel03': `✅ 취소가 완료되었습니다`,
		'cpcancel04': `✅ 가이드의 취소가 완료되었습니다`,
		'cpcancel05': `✅ 취소가 완료되었습니다`,
		'cpcancel06': `✅ ${templateData.고객 || '고객'}님의 취소가 완료되었습니다`,
		'cpcancel07': `✅ 취소가 완료되었습니다`,
		'cpcancel08': `✅ 가이드의 취소가 완료되었습니다`
	};
	
	return subjectMap[templateName] || 'MatchTrip 알림';
}

/**
 * Get template information for email
 */
export function getEmailTemplateInfo(templateName: string, isDev: boolean = process.env.NODE_ENV !== 'production'): any {
	const templateSource = isDev ? templates.dev : templates.prod;
	for (const template of Object.values(templateSource)) {
		if ((template as any).name === templateName) {
			return template;
		}
	}
	return null;
}
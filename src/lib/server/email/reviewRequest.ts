interface ReviewEmailData {
	travelerName: string;
	travelerEmail: string;
	guideName: string;
	destination: string;
	tripDates: {
		start: string;
		end: string;
	};
	reviewToken: string;
}

export function generateReviewRequestEmail(data: ReviewEmailData) {
	const reviewUrl = `${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/review?token=${data.reviewToken}`;
	
	const subject = `${data.guideName} 가이드님과의 여행은 어떠셨나요?`;
	
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
				}
				.container {
					background-color: #f8f9fa;
					border-radius: 8px;
					padding: 30px;
				}
				.header {
					text-align: center;
					margin-bottom: 30px;
				}
				.logo {
					font-size: 24px;
					font-weight: bold;
					color: #ec4899;
				}
				.content {
					background-color: white;
					padding: 30px;
					border-radius: 8px;
					box-shadow: 0 2px 4px rgba(0,0,0,0.1);
				}
				.button {
					display: inline-block;
					padding: 12px 30px;
					background-color: #ec4899;
					color: white;
					text-decoration: none;
					border-radius: 6px;
					font-weight: 500;
					margin: 20px 0;
				}
				.trip-info {
					background-color: #f8f9fa;
					padding: 15px;
					border-radius: 6px;
					margin: 20px 0;
				}
				.footer {
					text-align: center;
					margin-top: 30px;
					font-size: 14px;
					color: #666;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<div class="logo">MatchTrip</div>
				</div>
				
				<div class="content">
					<h2>안녕하세요 ${data.travelerName}님! 👋</h2>
					
					<p>${data.guideName} 가이드님과 함께한 ${data.destination} 여행이 성공적으로 완료되었습니다.</p>
					
					<div class="trip-info">
						<strong>여행 정보:</strong><br>
						📍 목적지: ${data.destination}<br>
						📅 기간: ${data.tripDates.start} - ${data.tripDates.end}<br>
						👤 가이드: ${data.guideName}
					</div>
					
					<p>여행은 어떠셨나요? ${data.travelerName}님의 소중한 후기는 다른 여행자들에게 큰 도움이 됩니다.</p>
					
					<p>아래 버튼을 클릭하여 간단한 후기를 남겨주세요:</p>
					
					<div style="text-align: center;">
						<a href="${reviewUrl}" class="button">리뷰 작성하기</a>
					</div>
					
					<p style="font-size: 14px; color: #666;">
						* 이 링크는 보안을 위해 일회용으로 생성되었습니다.<br>
						* 리뷰 작성 시 로그인이 필요합니다.
					</p>
				</div>
				
				<div class="footer">
					<p>이 이메일은 MatchTrip에서 발송되었습니다.</p>
					<p>문의사항이 있으시면 support@matchtrip.com으로 연락주세요.</p>
				</div>
			</div>
		</body>
		</html>
	`;
	
	const textContent = `
${subject}

안녕하세요 ${data.travelerName}님!

${data.guideName} 가이드님과 함께한 ${data.destination} 여행이 성공적으로 완료되었습니다.

여행 정보:
- 목적지: ${data.destination}
- 기간: ${data.tripDates.start} - ${data.tripDates.end}
- 가이드: ${data.guideName}

여행은 어떠셨나요? ${data.travelerName}님의 소중한 후기는 다른 여행자들에게 큰 도움이 됩니다.

아래 링크를 클릭하여 간단한 후기를 남겨주세요:
${reviewUrl}

* 이 링크는 보안을 위해 일회용으로 생성되었습니다.
* 리뷰 작성 시 로그인이 필요합니다.

감사합니다.
MatchTrip 팀 드림
	`;
	
	return {
		to: data.travelerEmail,
		subject,
		html: htmlContent,
		text: textContent
	};
}

// TODO: Integrate with your email service provider (SendGrid, AWS SES, etc.)
export async function sendReviewRequestEmail(data: ReviewEmailData) {
	const emailData = generateReviewRequestEmail(data);
	
	// For now, just log the email data
	console.log('Review request email prepared:', {
		to: emailData.to,
		subject: emailData.subject,
		reviewUrl: `${process.env.PUBLIC_BASE_URL || 'http://localhost:5173'}/review?token=${data.reviewToken}`
	});
	
	// TODO: Implement actual email sending
	// Example with SendGrid:
	// const sgMail = require('@sendgrid/mail');
	// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
	// await sgMail.send(emailData);
	
	return true;
}
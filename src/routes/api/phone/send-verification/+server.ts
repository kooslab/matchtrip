import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { infobipSMS } from '$lib/server/sms/infobip';
import { 
	canSendVerificationCode, 
	createVerificationCode, 
	formatPhoneForSMS,
	cleanupExpiredCodes 
} from '$lib/server/utils/phoneVerification';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { phone } = await request.json();

		if (!phone || phone.length !== 11) {
			return json({
				success: false,
				message: '올바른 휴대폰 번호를 입력해주세요.'
			}, { status: 400 });
		}

		// Clean up expired codes periodically
		await cleanupExpiredCodes();

		// Normalize phone number (remove dashes, spaces, etc)
		const normalizedPhone = phone.replace(/\D/g, '');
		
		console.log('[send-verification] Original phone:', phone);
		console.log('[send-verification] Normalized phone:', normalizedPhone);

		// Check rate limits
		// TODO: Re-enable rate limiting for production
		// const { allowed, reason } = await canSendVerificationCode(normalizedPhone);
		// if (!allowed) {
		// 	return json({
		// 		success: false,
		// 		message: reason
		// 	}, { status: 429 });
		// }

		// Generate verification code
		const code = await createVerificationCode(normalizedPhone);
		
		// Format phone number for SMS
		const formattedPhone = formatPhoneForSMS(phone);
		
		// Send SMS via Infobip
		const smsMessage = `[MatchTrip] 인증번호는 ${code} 입니다. 3분 이내에 입력해주세요.`;
		
		await infobipSMS.sendSMS({
			to: formattedPhone,
			text: smsMessage
		});

		console.log(`Verification code sent to ${phone}: ${code}`);

		return json({
			success: true,
			message: '인증번호가 전송되었습니다.'
		});
	} catch (error) {
		console.error('Error sending verification code:', error);
		return json({
			success: false,
			message: '인증번호 전송에 실패했습니다. 잠시 후 다시 시도해주세요.'
		}, { status: 500 });
	}
};

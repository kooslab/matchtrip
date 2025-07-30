import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyCode } from '$lib/server/utils/phoneVerification';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { phone, code } = await request.json();

		if (!phone || !code) {
			return json({
				success: false,
				verified: false,
				message: '휴대폰 번호와 인증번호를 입력해주세요.'
			}, { status: 400 });
		}

		// Normalize phone number (remove dashes, spaces, etc) to match what was stored
		const normalizedPhone = phone.replace(/\D/g, '');

		// Verify the code
		const { success, reason } = await verifyCode(normalizedPhone, code);

		if (!success) {
			return json({
				success: false,
				verified: false,
				message: reason || '인증에 실패했습니다.'
			}, { status: 400 });
		}

		// If user is logged in, update their phone verification status
		const session = await locals.auth();
		if (session?.user) {
			await db
				.update(users)
				.set({ 
					phone: normalizedPhone,
					phoneVerified: true,
					updatedAt: new Date()
				})
				.where(eq(users.id, session.user.id));
		}

		return json({
			success: true,
			verified: true,
			message: '인증이 완료되었습니다.'
		});
	} catch (error) {
		console.error('Error verifying code:', error);
		return json({
			success: false,
			verified: false,
			message: '인증 처리 중 오류가 발생했습니다.'
		}, { status: 500 });
	}
};

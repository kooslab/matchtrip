import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { phone } = await request.json();

	// Temporary implementation - always return success
	// TODO: Replace with actual SMS verification service

	console.log(`[TEMP] Phone verification requested for: ${phone}`);

	return json({
		success: true,
		message: '인증번호가 전송되었습니다.'
	});
};

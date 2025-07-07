import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { phone, code } = await request.json();
	
	// Temporary implementation - always return success for any code
	// TODO: Replace with actual verification logic
	
	console.log(`[TEMP] Phone verification attempt - Phone: ${phone}, Code: ${code}`);
	
	return json({ 
		success: true,
		verified: true,
		message: '인증이 완료되었습니다.'
	});
};
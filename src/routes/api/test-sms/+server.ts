import { json } from '@sveltejs/kit';
import { infobipSMS } from '$lib/server/sms/infobip';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { to, text } = await request.json();

		if (!to || !text) {
			return json({ error: 'Missing required fields: to, text' }, { status: 400 });
		}

		const result = await infobipSMS.sendSMS({
			to,
			text
		});

		return json({
			success: true,
			result
		});
	} catch (error) {
		console.error('SMS sending error:', error);
		return json({
			success: false,
			error: error instanceof Error ? error.message : 'Failed to send SMS'
		}, { status: 500 });
	}
};
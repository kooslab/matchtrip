import { json } from '@sveltejs/kit';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { to, sender, templateCode, text, templateData } = await request.json();

		if (!to || !sender || !templateCode || !text) {
			return json(
				{ error: 'Missing required fields: to, sender, templateCode, text' },
				{ status: 400 }
			);
		}

		const result = await kakaoAlimTalk.sendAlimTalk({
			to,
			sender,
			templateCode,
			text,
			templateData
		});

		return json({
			success: true,
			result
		});
	} catch (error) {
		console.error('Kakao AlimTalk sending error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to send Kakao AlimTalk'
			},
			{ status: 500 }
		);
	}
};

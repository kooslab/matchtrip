import { json } from '@sveltejs/kit';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const requestBody = await request.json();
		const { to, templateCode, text, templateData } = requestBody;

		console.log('=== Test Kakao API Endpoint ===');
		console.log('Received request body:', JSON.stringify(requestBody, null, 2));
		console.log('===============================');

		if (!to || !templateCode || !text) {
			return json(
				{ error: 'Missing required fields: to, templateCode, text' },
				{ status: 400 }
			);
		}

		if (!env.KAKAO_CHANNEL_PROFILE_KEY) {
			console.error('KAKAO_CHANNEL_PROFILE_KEY is not set in environment variables');
			return json(
				{ error: 'KAKAO_CHANNEL_PROFILE_KEY is not configured in environment variables' },
				{ status: 500 }
			);
		}

		console.log('Calling kakaoAlimTalk.sendAlimTalk with:', {
			to,
			templateCode,
			text,
			templateData
		});

		const result = await kakaoAlimTalk.sendAlimTalk({
			to,
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

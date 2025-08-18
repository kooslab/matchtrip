import { json } from '@sveltejs/kit';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const requestBody = await request.json();
		const { to, templateCode, text, templateData, buttons } = requestBody;

		console.log('=== Test Kakao API Endpoint ===');
		console.log('Received request body:', JSON.stringify(requestBody, null, 2));
		console.log('===============================');

		// Validate required fields
		if (!to || !templateCode || !text) {
			return json(
				{
					success: false,
					error: 'Missing required fields: to, templateCode, text',
					received: { to: !!to, templateCode: !!templateCode, text: !!text }
				},
				{ status: 400 }
			);
		}

		// Validate phone number format (Korean phone number)
		const phoneRegex = /^82\d{9,11}$/;
		if (!phoneRegex.test(to)) {
			return json(
				{
					success: false,
					error:
						'Invalid phone number format. Use international format without + (e.g., 821012345678)',
					received: to
				},
				{ status: 400 }
			);
		}

		// Check environment variables
		if (!env.KAKAO_CHANNEL_PROFILE_KEY) {
			console.error('KAKAO_CHANNEL_PROFILE_KEY is not set in environment variables');
			return json(
				{
					success: false,
					error: 'KAKAO_CHANNEL_PROFILE_KEY is not configured in environment variables'
				},
				{ status: 500 }
			);
		}

		if (!env.INFOBIP_API_KEY || !env.INFOBIP_BASE_URL) {
			console.error('Infobip credentials are not properly configured');
			return json(
				{
					success: false,
					error: 'Infobip API credentials are not configured in environment variables'
				},
				{ status: 500 }
			);
		}

		// Log template variable substitution
		if (templateData) {
			console.log('Template variables provided:', Object.keys(templateData));
			console.log('Template data values:', templateData);
		}

		console.log('Calling kakaoAlimTalk.sendAlimTalk with:', {
			to,
			templateCode,
			text: text.substring(0, 100) + '...', // Log first 100 chars only
			templateData,
			buttons
		});

		const result = await kakaoAlimTalk.sendAlimTalk({
			to,
			templateCode,
			text,
			templateData,
			buttons
		});

		// Check if the message was delivered successfully
		const messageResult = result.results?.[0];
		if (messageResult) {
			if (messageResult.status?.groupName === 'UNDELIVERABLE' || messageResult.error) {
				console.error('Message delivery failed:', messageResult);
				return json(
					{
						success: false,
						error:
							messageResult.error?.description ||
							messageResult.status?.description ||
							'Message delivery failed',
						details: {
							errorName: messageResult.error?.name,
							statusName: messageResult.status?.name,
							messageId: messageResult.messageId
						},
						result
					},
					{ status: 400 }
				);
			}
		}

		return json({
			success: true,
			result,
			message: 'Kakao AlimTalk sent successfully'
		});
	} catch (error) {
		console.error('Kakao AlimTalk sending error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to send Kakao AlimTalk',
				details: error instanceof Error ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};

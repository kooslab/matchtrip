import { json } from '@sveltejs/kit';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messageId, bulkId, sentSince, sentUntil, limit } = await request.json();

		console.log('=== Test Kakao Logs API Endpoint ===');
		console.log('Received params:', { messageId, bulkId, sentSince, sentUntil, limit });
		console.log('====================================');

		const result = await kakaoAlimTalk.getLogs({
			messageId,
			bulkId,
			sentSince,
			sentUntil,
			limit: limit || 10
		});

		return json({
			success: true,
			result
		});
	} catch (error) {
		console.error('Kakao AlimTalk logs error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get Kakao AlimTalk logs'
			},
			{ status: 500 }
		);
	}
};
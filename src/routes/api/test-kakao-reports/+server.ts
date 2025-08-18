import { json } from '@sveltejs/kit';
import { kakaoAlimTalk } from '$lib/server/kakao/kakaoAlimTalk';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { messageId, bulkId, limit, entityId, applicationId, campaignReferenceId } =
			await request.json();

		console.log('=== Test Kakao Delivery Reports API Endpoint ===');
		console.log('Received params:', {
			messageId,
			bulkId,
			limit,
			entityId,
			applicationId,
			campaignReferenceId
		});
		console.log('================================================');

		const result = await kakaoAlimTalk.getDeliveryReports({
			messageId,
			bulkId,
			limit: limit || 10,
			entityId,
			applicationId,
			campaignReferenceId
		});

		return json({
			success: true,
			result
		});
	} catch (error) {
		console.error('Kakao AlimTalk delivery reports error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Failed to get delivery reports'
			},
			{ status: 500 }
		);
	}
};

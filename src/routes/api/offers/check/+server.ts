import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/auth';

export const GET: RequestHandler = async ({ url, request }) => {
	try {
		// Get session
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const tripId = url.searchParams.get('tripId');

		if (!tripId) {
			return json({ success: false, error: '여행 ID가 필요합니다.' }, { status: 400 });
		}

		// Check if guide has already made an offer for this trip
		const existingOffer = await db
			.select({ id: offers.id })
			.from(offers)
			.where(and(eq(offers.tripId, tripId), eq(offers.guideId, session.user.id)))
			.limit(1);

		return json({
			success: true,
			hasOffer: existingOffer.length > 0
		});
	} catch (error) {
		console.error('Error checking existing offer:', error);
		return json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
};

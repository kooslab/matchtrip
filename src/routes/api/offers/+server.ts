import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers, users, trips } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/auth';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get session
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		// Check if user is a guide
		const user = await db
			.select({ role: users.role })
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		if (user.length === 0 || user[0].role !== 'guide') {
			return json({ success: false, error: '가이드만 제안할 수 있습니다.' }, { status: 403 });
		}

		const { tripId, pricePerPerson, itinerary } = await request.json();

		// Validate input
		if (!tripId || !pricePerPerson || !itinerary) {
			return json({ success: false, error: '모든 필드를 입력해주세요.' }, { status: 400 });
		}

		if (typeof pricePerPerson !== 'number' || pricePerPerson <= 0) {
			return json({ success: false, error: '올바른 가격을 입력해주세요.' }, { status: 400 });
		}

		if (typeof itinerary !== 'string' || itinerary.trim().length === 0) {
			return json({ success: false, error: '여행 일정을 입력해주세요.' }, { status: 400 });
		}

		// Check if guide has already made an offer for this trip
		const existingOffer = await db
			.select({ id: offers.id })
			.from(offers)
			.where(and(eq(offers.tripId, tripId), eq(offers.guideId, session.user.id)))
			.limit(1);

		if (existingOffer.length > 0) {
			return json({ success: false, error: '이미 이 여행에 제안을 하셨습니다.' }, { status: 400 });
		}

		// Get trip details to get traveler ID and calculate total price
		const tripDetails = await db
			.select({
				userId: trips.userId,
				adultsCount: trips.adultsCount
			})
			.from(trips)
			.where(eq(trips.id, tripId))
			.limit(1);

		if (tripDetails.length === 0) {
			return json({ success: false, error: '여행을 찾을 수 없습니다.' }, { status: 404 });
		}

		const totalPrice = pricePerPerson * tripDetails[0].adultsCount;

		// Create offer
		const newOffer = await db
			.insert(offers)
			.values({
				tripId,
				guideId: session.user.id,
				travelerId: tripDetails[0].userId,
				title: '가이드 제안',
				description: '가이드가 제안한 여행 일정입니다.',
				price: totalPrice,
				currency: 'KRW',
				itinerary: itinerary.trim(),
				status: 'pending'
			})
			.returning();

		return json({
			success: true,
			offer: newOffer[0]
		});
	} catch (error) {
		console.error('Error creating offer:', error);
		return json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
};

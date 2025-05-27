import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips, destinations, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

export const GET: RequestHandler = async ({ params, request }) => {
	try {
		// Get session
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const tripId = params.id;

		if (!tripId) {
			return json({ success: false, error: '여행 ID가 필요합니다.' }, { status: 400 });
		}

		// Fetch trip with destination and traveler info
		const trip = await db
			.select({
				id: trips.id,
				startDate: trips.startDate,
				endDate: trips.endDate,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status,
				createdAt: trips.createdAt,
				destination: {
					id: destinations.id,
					city: destinations.city,
					country: destinations.country
				},
				traveler: {
					id: users.id,
					name: users.name
				}
			})
			.from(trips)
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(users, eq(trips.userId, users.id))
			.where(eq(trips.id, tripId))
			.limit(1);

		if (trip.length === 0) {
			return json({ success: false, error: '여행을 찾을 수 없습니다.' }, { status: 404 });
		}

		// Check if trip is available for offers (status should be 'submitted')
		if (trip[0].status !== 'submitted') {
			return json(
				{ success: false, error: '이 여행은 더 이상 제안을 받지 않습니다.' },
				{ status: 400 }
			);
		}

		return json({
			success: true,
			trip: trip[0]
		});
	} catch (error) {
		console.error('Error fetching trip:', error);
		return json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
};

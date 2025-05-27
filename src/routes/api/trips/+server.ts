import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trips, destinations, offers } from '$lib/server/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { auth } from '$lib/auth';

export async function POST({ request }) {
	try {
		// Check authentication first
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return json({ success: false, error: '인증되지 않은 요청입니다.' }, { status: 401 });
		}

		const body = await request.json();
		const {
			destination,
			adultsCount,
			childrenCount,
			startDate,
			endDate,
			travelMethod,
			customRequest
		} = body;

		// Validate required fields
		if (!destination || !startDate || !endDate) {
			return json({ success: false, error: 'Missing required fields' }, { status: 400 });
		}

		// Find destination ID by city name
		const destinationRecord = await db
			.select()
			.from(destinations)
			.where(eq(destinations.city, destination))
			.limit(1);

		if (destinationRecord.length === 0) {
			return json({ success: false, error: 'Destination not found' }, { status: 400 });
		}

		const destinationId = destinationRecord[0].id;

		// Create the trip
		const newTrip = await db
			.insert(trips)
			.values({
				userId: session.user.id,
				destinationId,
				adultsCount: adultsCount || 1,
				childrenCount: childrenCount || 0,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				travelMethod: travelMethod || null,
				customRequest: customRequest || null,
				status: 'submitted' // Set to submitted when expert proposal is requested
			})
			.returning();

		return json({ success: true, trip: newTrip[0] });
	} catch (error) {
		console.error('Error creating trip:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

export async function GET({ request }) {
	try {
		// Check authentication first
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return json({ success: false, error: '인증되지 않은 요청입니다.' }, { status: 401 });
		}

		// Fetch user's trips with destination information (simplified query)
		const userTrips = await db
			.select({
				id: trips.id,
				userId: trips.userId,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				startDate: trips.startDate,
				endDate: trips.endDate,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status,
				statusUpdatedAt: trips.statusUpdatedAt,
				createdAt: trips.createdAt,
				updatedAt: trips.updatedAt,
				destination: {
					id: destinations.id,
					city: destinations.city,
					country: destinations.country
				}
			})
			.from(trips)
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.where(eq(trips.userId, session.user.id))
			.orderBy(desc(trips.createdAt));

		// Add offer count separately for each trip
		const tripsWithOfferCount = await Promise.all(
			userTrips.map(async (trip) => {
				const offerCountResult = await db
					.select({ count: count(offers.id) })
					.from(offers)
					.where(eq(offers.tripId, trip.id));

				return {
					...trip,
					offerCount: offerCountResult[0]?.count || 0
				};
			})
		);

		return json({ success: true, trips: tripsWithOfferCount });
	} catch (error) {
		console.error('Error fetching trips:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trips, destinations, offers } from '$lib/server/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { auth } from '$lib/auth';

export async function POST({ request, locals }) {
	try {
		const session = locals.session;

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const tripData = await request.json();

		// Use the existing destination ID from the search
		if (!tripData.destination.id) {
			return json({ error: 'Invalid destination data' }, { status: 400 });
		}

		// Insert trip with existing destination ID
		const [trip] = await db
			.insert(trips)
			.values({
				userId: session.user.id,
				destinationId: tripData.destination.id,
				startDate: new Date(tripData.startDate),
				endDate: new Date(tripData.endDate),
				adultsCount: tripData.adultsCount,
				childrenCount: tripData.childrenCount,
				travelMethod: tripData.travelMethod,
				customRequest: tripData.customRequest,
				status: 'submitted'
			})
			.returning();

		return json({ trip });
	} catch (error) {
		console.error('Error creating trip:', error);
		return json({ error: 'Failed to create trip' }, { status: 500 });
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

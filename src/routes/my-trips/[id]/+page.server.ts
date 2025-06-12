import { db } from '$lib/server/db';
import { trips, destinations, users, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ params, request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;

	console.log('Trip details page - Session from locals:', !!session);

	// If no session in locals, get it directly
	if (!session) {
		console.log('Trip details page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('Trip details page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	const tripId = params.id;

	if (!tripId) {
		throw redirect(302, '/my-trips');
	}

	// Fetch trip details with destination info
	const trip = await db
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
			createdAt: trips.createdAt,
			destination: {
				id: destinations.id,
				city: destinations.city,
				country: destinations.country
			}
		})
		.from(trips)
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
		.limit(1);

	if (trip.length === 0) {
		throw redirect(302, '/my-trips');
	}

	// Fetch offers for this trip with guide information
	const tripOffers = await db
		.select({
			id: offers.id,
			price: offers.price,
			itinerary: offers.itinerary,
			status: offers.status,
			createdAt: offers.createdAt,
			guide: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(offers)
		.leftJoin(users, eq(offers.guideId, users.id))
		.where(eq(offers.tripId, tripId))
		.orderBy(offers.createdAt);

	return {
		trip: trip[0],
		offers: tripOffers
	};
};
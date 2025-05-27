import { db } from '$lib/server/db';
import { trips, destinations, users, offers } from '$lib/server/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;
	let user = locals.user;

	console.log('Trips page - Session from locals:', !!session, 'User from locals:', !!user);

	// If no session in locals, get it directly
	if (!session) {
		console.log('Trips page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });

		if (session?.user?.id) {
			user = await db.query.users.findFirst({
				where: eq(users.id, session.user.id),
				columns: {
					id: true,
					role: true,
					name: true,
					email: true
				}
			});
		}
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('Trips page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	// Only allow guides to access this page
	if (!user || user.role !== 'guide') {
		console.log('Trips page - Not a guide, redirecting to home');
		throw redirect(302, '/');
	}

	// Fetch trips that are submitted (available for guides to make offers)
	// Include both trips without offers and trips where current guide has made offers
	// Exclude cancelled, completed, and accepted trips
	const availableTrips = await db
		.select({
			id: trips.id,
			userId: trips.userId,
			destinationId: trips.destinationId,
			adultsCount: trips.adultsCount,
			childrenCount: trips.childrenCount,
			startDate: trips.startDate,
			endDate: trips.endDate,
			travelMethod: trips.travelMethod,
			customRequest: trips.customRequest,
			status: trips.status,
			createdAt: trips.createdAt,
			// Destination info
			destination: {
				city: destinations.city,
				country: destinations.country
			},
			// Traveler info
			traveler: {
				name: users.name,
				email: users.email
			},
			// Check if current guide has made an offer
			hasOffer: offers.id,
			// Get offer details if exists
			offerPrice: offers.price,
			offerStatus: offers.status
		})
		.from(trips)
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.leftJoin(offers, and(eq(offers.tripId, trips.id), eq(offers.guideId, session.user.id)))
		.where(
			and(
				eq(trips.status, 'submitted'),
				ne(trips.userId, session.user.id) // Don't show guide's own trips
			)
		)
		.orderBy(trips.createdAt);

	return {
		trips: availableTrips
	};
};

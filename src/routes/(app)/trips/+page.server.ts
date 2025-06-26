import { db } from '$lib/server/db';
import { trips, destinations, users, offers, conversations } from '$lib/server/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export const load = async ({ locals }) => {
	// Session and user are guaranteed to exist and be valid due to auth guard in hooks.server.ts
	const session = locals.session;
	const user = locals.user;

	console.log('Trips page - Session from locals:', !!session, 'User from locals:', !!user);
	console.log('Trips page - User role:', user?.role);
	console.log('Trips page - Access granted for guide:', user?.email);

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
			offerId: offers.id,
			offerPrice: offers.price,
			offerStatus: offers.status,
			// Get conversation details if exists
			conversationId: conversations.id
		})
		.from(trips)
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.leftJoin(offers, and(eq(offers.tripId, trips.id), eq(offers.guideId, session.user.id)))
		.leftJoin(conversations, eq(conversations.offerId, offers.id))
		.where(
			and(
				eq(trips.status, 'submitted'),
				ne(trips.userId, session.user.id) // Don't show guide's own trips
			)
		)
		.orderBy(trips.createdAt);

	return {
		trips: availableTrips,
		userRole: user?.role || null
	};
};
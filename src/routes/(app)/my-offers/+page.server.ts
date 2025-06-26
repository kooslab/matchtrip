import { db } from '$lib/server/db';
import { trips, destinations, users, offers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ locals }) => {
	// Session and user are guaranteed to exist and be valid due to auth guard in hooks.server.ts
	const session = locals.session;
	const user = locals.user;

	console.log('My-offers page - Session from locals:', !!session, 'User from locals:', !!user);
	console.log('My-offers page - User role:', user?.role);
	console.log('My-offers page - Access granted for guide:', user?.email);

	// Fetch all offers made by the current guide
	const myOffers = await db
		.select({
			id: offers.id,
			tripId: offers.tripId,
			price: offers.price,
			title: offers.title,
			description: offers.description,
			status: offers.status,
			createdAt: offers.createdAt,
			updatedAt: offers.updatedAt,
			// Trip info
			trip: {
				id: trips.id,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				startDate: trips.startDate,
				endDate: trips.endDate,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status
			},
			// Destination info
			destination: {
				city: destinations.city,
				country: destinations.country
			},
			// Traveler info
			traveler: {
				name: users.name,
				email: users.email
			}
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.where(eq(offers.guideId, session.user.id))
		.orderBy(offers.createdAt);

	// Group offers by status
	const groupedOffers = {
		pending: myOffers.filter((offer) => offer.status === 'pending'),
		accepted: myOffers.filter((offer) => offer.status === 'accepted'),
		rejected: myOffers.filter((offer) => offer.status === 'rejected')
	};

	return {
		offers: groupedOffers,
		totalOffers: myOffers.length
	};
};

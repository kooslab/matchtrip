import { db } from '$lib/server/db';
import { trips, destinations, users, offers, countries, payments } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { transformImageUrl } from '$lib/utils/imageUrl';

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
				imageUrl: destinations.imageUrl
			},
			// Country info
			country: {
				name: countries.name,
				code: countries.code
			},
			// Traveler info
			traveler: {
				name: users.name,
				email: users.email
			},
			// Payment info (if exists)
			paymentOrderId: payments.orderId
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(countries, eq(destinations.countryId, countries.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.leftJoin(payments, and(eq(payments.offerId, offers.id), eq(payments.status, 'completed')))
		.where(eq(offers.guideId, session.user.id))
		.orderBy(offers.createdAt);

	// Transform image URLs for destinations
	const transformedOffers = myOffers.map((offer) => ({
		...offer,
		destination: offer.destination
			? {
					...offer.destination,
					imageUrl: transformImageUrl(offer.destination.imageUrl)
				}
			: offer.destination
	}));

	// Group offers by status
	const groupedOffers = {
		pending: transformedOffers.filter((offer) => offer.status === 'pending'),
		accepted: transformedOffers.filter((offer) => offer.status === 'accepted'),
		rejected: transformedOffers.filter((offer) => offer.status === 'rejected')
	};

	return {
		offers: groupedOffers,
		totalOffers: transformedOffers.length
	};
};

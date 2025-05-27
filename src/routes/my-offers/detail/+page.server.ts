import { db } from '$lib/server/db';
import { trips, destinations, users, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ url, locals }) => {
	// Use cached session and user data from layout
	const session = locals.session;
	const user = locals.user;

	// Redirect if not logged in
	if (!session?.user) {
		throw redirect(302, '/signin');
	}

	// Only allow guides to access this page
	if (!user || user.role !== 'guide') {
		throw redirect(302, '/');
	}

	const offerId = url.searchParams.get('offerId');

	if (!offerId) {
		throw redirect(302, '/my-offers');
	}

	// Fetch detailed offer information
	const offerDetails = await db
		.select({
			// Offer info
			id: offers.id,
			tripId: offers.tripId,
			price: offers.price,
			title: offers.title,
			description: offers.description,
			itinerary: offers.itinerary,
			currency: offers.currency,
			duration: offers.duration,
			maxParticipants: offers.maxParticipants,
			status: offers.status,
			validUntil: offers.validUntil,
			createdAt: offers.createdAt,
			updatedAt: offers.updatedAt,
			// Trip info
			trip: {
				id: trips.id,
				userId: trips.userId,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				startDate: trips.startDate,
				endDate: trips.endDate,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status,
				createdAt: trips.createdAt
			},
			// Destination info
			destination: {
				id: destinations.id,
				city: destinations.city,
				country: destinations.country
			},
			// Traveler info
			traveler: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.where(and(eq(offers.id, offerId), eq(offers.guideId, session.user.id)))
		.limit(1);

	if (offerDetails.length === 0) {
		throw redirect(302, '/my-offers');
	}

	return {
		offer: offerDetails[0]
	};
};

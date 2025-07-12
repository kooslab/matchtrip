import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { trips, users, destinations, countries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const tripId = url.searchParams.get('tripId');

	if (!tripId) {
		error(400, 'Trip ID is required');
	}

	// Fetch trip details with traveler info and destination
	const trip = await db
		.select({
			id: trips.id,
			travelerId: trips.userId,
			destinationId: trips.destinationId,
			destination: destinations.city,
			countryName: countries.name,
			departureDate: trips.startDate,
			returnDate: trips.endDate,
			adultsCount: trips.adultsCount,
			childrenCount: trips.childrenCount,
			babiesCount: trips.babiesCount,
			travelMethod: trips.travelMethod,
			customRequest: trips.customRequest,
			travelerName: users.name,
			travelerEmail: users.email,
			travelerImage: users.image
		})
		.from(trips)
		.leftJoin(users, eq(trips.userId, users.id))
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(countries, eq(destinations.countryId, countries.id))
		.where(eq(trips.id, tripId))
		.limit(1);

	if (!trip.length) {
		error(404, 'Trip not found');
	}

	return {
		trip: {
			...trip[0],
			// Add default values for missing fields
			budget: null,
			currency: 'KRW',
			purpose: trip[0].customRequest || null,
			interests: null
		}
	};
};

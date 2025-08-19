import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { trips, users, destinations, countries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { decryptUserFields } from '$lib/server/encryption';

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

	// Decrypt traveler information
	const decryptedTrip = {
		...trip[0],
		travelerName: trip[0].travelerName ? decryptUserFields({ name: trip[0].travelerName }).name : null,
		travelerEmail: trip[0].travelerEmail ? decryptUserFields({ email: trip[0].travelerEmail }).email : null
	};

	return {
		trip: {
			...decryptedTrip,
			// Add default values for missing fields
			budget: null,
			currency: 'KRW',
			purpose: decryptedTrip.customRequest || null,
			interests: null
		}
	};
};

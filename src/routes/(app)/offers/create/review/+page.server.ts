import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { trips, destinations, countries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const tripId = url.searchParams.get('tripId');

	if (!tripId) {
		error(400, 'Trip ID is required');
	}

	// Fetch trip details with destination for review page
	const trip = await db
		.select({
			id: trips.id,
			destinationId: trips.destinationId,
			destination: destinations.city,
			countryName: countries.name,
			departureDate: trips.startDate,
			returnDate: trips.endDate,
			adultsCount: trips.adultsCount,
			childrenCount: trips.childrenCount,
			babiesCount: trips.babiesCount
		})
		.from(trips)
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(countries, eq(destinations.countryId, countries.id))
		.where(eq(trips.id, tripId))
		.limit(1);

	if (!trip.length) {
		error(404, 'Trip not found');
	}

	return {
		trip: trip[0]
	};
};

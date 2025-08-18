import { db } from '$lib/server/db';
import { trips, destinations, offers, countries, continents } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import { transformImageUrl } from '$lib/utils/imageUrl';

export const load = async ({ locals, depends, setHeaders }) => {
	// Add dependency for cache invalidation
	depends('app:trips');

	// No cache headers for user-specific data to prevent showing stale data

	// Session is guaranteed to exist here due to auth guard in hooks.server.ts
	const session = locals.session;

	console.log('My-trips page - Session from locals:', !!session);

	if (!session?.user?.id) {
		return {
			trips: [],
			session
		};
	}

	try {
		console.log('My-trips page - Fetching from database for user:', session.user.id);
		const userTrips = await db
			.select({
				id: trips.id,
				startDate: trips.startDate,
				endDate: trips.endDate,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status,
				createdAt: trips.createdAt,
				destination: {
					id: destinations.id,
					city: destinations.city,
					imageUrl: destinations.imageUrl
				},
				country: {
					id: countries.id,
					name: countries.name,
					code: countries.code
				},
				continent: {
					id: continents.id,
					name: continents.name,
					code: continents.code
				},
				offerCount: count(offers.id)
			})
			.from(trips)
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.leftJoin(continents, eq(countries.continentId, continents.id))
			.leftJoin(offers, eq(trips.id, offers.tripId))
			.where(eq(trips.userId, session.user.id))
			.groupBy(trips.id, destinations.id, countries.id, continents.id)
			.orderBy(trips.createdAt);

		console.log('My-trips page - Fetched trips from DB:', userTrips.length);

		// Transform image URLs for destinations
		const transformedTrips = userTrips.map((trip) => ({
			...trip,
			destination: trip.destination
				? {
						...trip.destination,
						imageUrl: transformImageUrl(trip.destination.imageUrl)
					}
				: trip.destination
		}));

		return {
			trips: transformedTrips,
			session
		};
	} catch (error) {
		console.error('My-trips page - Error fetching trips:', error);
		return {
			trips: [],
			session,
			error: 'Failed to load trips'
		};
	}
};

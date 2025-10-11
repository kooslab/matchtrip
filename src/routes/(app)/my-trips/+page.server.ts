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
				destinationId: destinations.id,
				destinationCity: destinations.city,
				destinationImageUrl: destinations.imageUrl,
				countryId: countries.id,
				countryName: countries.name,
				countryCode: countries.code,
				continentId: continents.id,
				continentName: continents.name,
				continentCode: continents.code,
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

		// Transform image URLs and restructure data
		const transformedTrips = userTrips.map((trip) => ({
			id: trip.id,
			startDate: trip.startDate,
			endDate: trip.endDate,
			adultsCount: trip.adultsCount,
			childrenCount: trip.childrenCount,
			travelMethod: trip.travelMethod,
			customRequest: trip.customRequest,
			status: trip.status,
			createdAt: trip.createdAt,
			offerCount: trip.offerCount,
			destination: trip.destinationId
				? {
						id: trip.destinationId,
						city: trip.destinationCity,
						imageUrl: transformImageUrl(trip.destinationImageUrl)
					}
				: null,
			country: trip.countryId
				? {
						id: trip.countryId,
						name: trip.countryName,
						code: trip.countryCode
					}
				: null,
			continent: trip.continentId
				? {
						id: trip.continentId,
						name: trip.continentName,
						code: trip.continentCode
					}
				: null
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

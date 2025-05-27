import { db } from '$lib/server/db';
import { trips, destinations, offers } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';

export const load = async ({ locals, depends, setHeaders }) => {
	// Add dependency for cache invalidation
	depends('app:trips');

	// Set proper cache headers - SvelteKit will handle the caching
	setHeaders({
		'cache-control': 'private, max-age=300, stale-while-revalidate=60'
	});

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
					country: destinations.country
				},
				offerCount: count(offers.id)
			})
			.from(trips)
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(offers, eq(trips.id, offers.tripId))
			.where(eq(trips.userId, session.user.id))
			.groupBy(trips.id, destinations.id)
			.orderBy(trips.createdAt);

		console.log('My-trips page - Fetched trips from DB:', userTrips.length);

		return {
			trips: userTrips,
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

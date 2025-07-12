import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('[ADMIN TRIPS] Starting load function');

	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		console.log('[ADMIN TRIPS] User not admin, redirecting');
		throw redirect(302, '/');
	}

	console.log('[ADMIN TRIPS] Importing database modules...');

	try {
		// Import database modules inside try-catch to isolate issues
		const { db } = await import('$lib/server/db');
		console.log('[ADMIN TRIPS] db imported');

		const { trips, users, offers, destinations, countries } = await import('$lib/server/db/schema');
		console.log('[ADMIN TRIPS] Schema imported');

		const { desc, eq, sql } = await import('drizzle-orm');
		console.log('[ADMIN TRIPS] Drizzle functions imported');

		console.log('[ADMIN TRIPS] About to create query');

		// Start with the simplest possible query
		const allTrips = await db.select().from(trips).orderBy(desc(trips.createdAt));

		console.log('[ADMIN TRIPS] Basic query completed, trips:', allTrips.length);

		// Try to add user data
		const tripsWithUsers = await db
			.select({
				id: trips.id,
				destinationCity: destinations.city,
				destinationCountry: countries.name,
				startDate: trips.startDate,
				endDate: trips.endDate,
				status: trips.status,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				babiesCount: trips.babiesCount,
				travelStyle: trips.travelStyle,
				budgetMin: trips.budgetMin,
				budgetMax: trips.budgetMax,
				createdAt: trips.createdAt,
				updatedAt: trips.updatedAt,
				userId: trips.userId,
				userName: users.name,
				userEmail: users.email
			})
			.from(trips)
			.leftJoin(users, eq(trips.userId, users.id))
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.orderBy(desc(trips.createdAt));

		console.log('[ADMIN TRIPS] Query with joins completed');

		// Transform data
		const enhancedTrips = tripsWithUsers.map((trip) => ({
			...trip,
			travelerName: trip.userName || 'Unknown',
			travelerEmail: trip.userEmail || 'Unknown',
			offerCount: 0,
			acceptedOfferId: null
		}));

		// Calculate statistics
		const stats = {
			total: enhancedTrips.length,
			draft: enhancedTrips.filter((t) => t.status === 'draft').length,
			submitted: enhancedTrips.filter((t) => t.status === 'submitted').length,
			accepted: enhancedTrips.filter((t) => t.status === 'accepted').length,
			completed: enhancedTrips.filter((t) => t.status === 'completed').length,
			cancelled: enhancedTrips.filter((t) => t.status === 'cancelled').length
		};

		console.log('[ADMIN TRIPS] Returning data');
		return {
			trips: enhancedTrips,
			stats
		};
	} catch (error) {
		console.error('[ADMIN TRIPS] Error:', error);
		console.error('[ADMIN TRIPS] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

		// Return minimal data on error
		return {
			trips: [],
			stats: {
				total: 0,
				draft: 0,
				submitted: 0,
				accepted: 0,
				completed: 0,
				cancelled: 0
			}
		};
	}
};

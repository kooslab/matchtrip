import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { trips, users, destinations, offers } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	// Fetch all trips with related data
	const allTrips = await db
		.select({
			id: trips.id,
			destination: trips.destination,
			startDate: trips.startDate,
			endDate: trips.endDate,
			status: trips.status,
			people: trips.people,
			tourType: trips.tourType,
			budget: trips.budget,
			createdAt: trips.createdAt,
			updatedAt: trips.updatedAt,
			travelerName: users.name,
			travelerEmail: users.email,
			offerCount: sql<number>`(
				SELECT COUNT(*)
				FROM ${offers}
				WHERE ${offers.tripId} = ${trips.id}
			)`.as('offerCount'),
			acceptedOfferId: sql<string>`(
				SELECT ${offers.id}
				FROM ${offers}
				WHERE ${offers.tripId} = ${trips.id}
				AND ${offers.status} = 'accepted'
				LIMIT 1
			)`.as('acceptedOfferId')
		})
		.from(trips)
		.leftJoin(users, eq(trips.userId, users.id))
		.orderBy(desc(trips.createdAt));

	// Calculate statistics
	const stats = {
		total: allTrips.length,
		draft: allTrips.filter(t => t.status === 'draft').length,
		submitted: allTrips.filter(t => t.status === 'submitted').length,
		accepted: allTrips.filter(t => t.status === 'accepted').length,
		completed: allTrips.filter(t => t.status === 'completed').length,
		cancelled: allTrips.filter(t => t.status === 'cancelled').length
	};

	return {
		trips: allTrips,
		stats
	};
};
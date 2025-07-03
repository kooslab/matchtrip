import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trips, destinations, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load = (async ({ params, locals }) => {
	const session = await locals.auth();

	if (!session || !session.user) {
		throw redirect(303, '/signin');
	}

	const tripId = params.id;

	try {
		// Get trip details with destination
		const tripData = await db
			.select({
				trip: trips,
				destination: destinations
			})
			.from(trips)
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
			.limit(1);

		if (!tripData || tripData.length === 0) {
			throw error(404, 'Trip not found');
		}

		const trip = {
			...tripData[0].trip,
			destination: tripData[0].destination
		};

		// Check if there are any offers - if yes, redirect back
		const existingOffers = await db.select().from(offers).where(eq(offers.tripId, tripId)).limit(1);

		if (existingOffers.length > 0) {
			// Can't edit trip with existing offers
			throw redirect(303, `/my-trips/${tripId}`);
		}

		return {
			trip
		};
	} catch (err) {
		console.error('Error loading trip for edit:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to load trip');
	}
}) satisfies PageServerLoad;

import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trips, destinations, users, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const load = (async ({ params, locals }) => {
	const session = locals.session;
	
	if (!session || !session.user) {
		throw redirect(303, '/signin');
	}

	// Check if user is a guide using locals
	const userRole = locals.user?.role;
	
	if (userRole !== 'guide') {
		throw error(403, 'Access denied. Only guides can view this page.');
	}

	const tripId = params.id;

	try {
		// Get trip details with destination and user info
		const tripData = await db
			.select({
				trip: trips,
				destination: destinations,
				user: users
			})
			.from(trips)
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(users, eq(trips.userId, users.id))
			.where(eq(trips.id, tripId))
			.limit(1);

		if (!tripData || tripData.length === 0) {
			throw error(404, 'Trip not found');
		}

		const trip = {
			...tripData[0].trip,
			destination: tripData[0].destination,
			user: tripData[0].user ? {
				id: tripData[0].user.id,
				name: tripData[0].user.name,
				email: tripData[0].user.email,
				createdAt: tripData[0].user.createdAt
			} : null
		};

		// Check if the guide has already made an offer for this trip
		const existingOffer = await db
			.select()
			.from(offers)
			.where(
				and(
					eq(offers.tripId, tripId),
					eq(offers.guideId, session.user.id)
				)
			)
			.limit(1);

		return {
			trip,
			hasExistingOffer: existingOffer.length > 0
		};
	} catch (err) {
		console.error('Error loading trip details:', err);
		if (err instanceof Response) throw err;
		throw error(500, 'Failed to load trip details');
	}
}) satisfies PageServerLoad;
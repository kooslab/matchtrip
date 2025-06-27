import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.auth();
	
	if (!session || !session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const tripId = params.id;
	const updates = await request.json();

	try {
		// Verify trip ownership
		const [existingTrip] = await db
			.select()
			.from(trips)
			.where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
			.limit(1);

		if (!existingTrip) {
			return json({ error: 'Trip not found' }, { status: 404 });
		}

		// Check if there are any offers - can't edit if offers exist
		const existingOffers = await db
			.select()
			.from(offers)
			.where(eq(offers.tripId, tripId))
			.limit(1);

		if (existingOffers.length > 0) {
			return json({ error: 'Cannot edit trip with existing offers' }, { status: 400 });
		}

		// Update only allowed fields
		const allowedUpdates: any = {};
		
		if (updates.minBudget !== undefined) {
			allowedUpdates.minBudget = updates.minBudget;
		}
		
		if (updates.maxBudget !== undefined) {
			allowedUpdates.maxBudget = updates.maxBudget;
		}
		
		if (updates.customRequest !== undefined) {
			allowedUpdates.customRequest = updates.customRequest;
		}

		// Add updatedAt
		allowedUpdates.updatedAt = new Date();

		// Perform update
		const [updatedTrip] = await db
			.update(trips)
			.set(allowedUpdates)
			.where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
			.returning();

		return json({ success: true, trip: updatedTrip });
	} catch (error) {
		console.error('Error updating trip:', error);
		return json({ error: 'Failed to update trip' }, { status: 500 });
	}
};
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;

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
		const existingOffers = await db.select().from(offers).where(eq(offers.tripId, tripId)).limit(1);

		if (existingOffers.length > 0) {
			return json({ error: 'Cannot edit trip with existing offers' }, { status: 400 });
		}

		console.log('Received updates:', updates);
		console.log('Existing trip:', existingTrip);

		// Prepare full update
		const tripUpdate: any = {
			destinationId: updates.destinationId || existingTrip.destinationId,
			startDate: updates.startDate ? new Date(updates.startDate) : existingTrip.startDate,
			endDate: updates.endDate ? new Date(updates.endDate) : existingTrip.endDate,
			adultsCount: updates.adultsCount ?? existingTrip.adultsCount,
			childrenCount: updates.childrenCount ?? existingTrip.childrenCount,
			babiesCount: updates.babiesCount ?? existingTrip.babiesCount,
			travelStyle: updates.travelStyle || existingTrip.travelStyle,
			budgetMin: updates.budgetMin ?? updates.minBudget ?? existingTrip.budgetMin,
			budgetMax: updates.budgetMax ?? updates.maxBudget ?? existingTrip.budgetMax,
			activities: updates.activities || existingTrip.activities || [],
			customRequest: updates.customRequest ?? existingTrip.customRequest,
			additionalRequest: updates.customRequest ?? existingTrip.additionalRequest,
			updatedAt: new Date()
		};

		console.log('Trip update payload:', tripUpdate);

		// Perform update
		console.log('Executing database update for tripId:', tripId);
		console.log('User ID:', session.user.id);

		try {
			const [updatedTrip] = await db
				.update(trips)
				.set(tripUpdate)
				.where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
				.returning();

			console.log('Updated trip result:', updatedTrip);

			if (!updatedTrip) {
				console.error('No trip was updated - possible permission issue or trip not found');
				return json({ error: 'Failed to update trip - no rows affected' }, { status: 404 });
			}

			return json({ success: true, trip: updatedTrip });
		} catch (dbError) {
			console.error('Database update error:', dbError);
			throw dbError;
		}
	} catch (error) {
		console.error('Error updating trip:', error);
		return json({ error: 'Failed to update trip' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;

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
		const existingOffers = await db.select().from(offers).where(eq(offers.tripId, tripId)).limit(1);

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

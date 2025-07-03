import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips, offers, tripStatusHistory } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id: tripId } = params;

		// Verify the user is the guide for this trip with an accepted offer
		const trip = await db.query.trips.findFirst({
			where: eq(trips.id, tripId),
			with: {
				offers: {
					where: and(eq(offers.guideId, session.user.id), eq(offers.status, 'accepted')),
					limit: 1
				}
			}
		});

		if (!trip || trip.offers.length === 0) {
			return json({ error: 'Trip not found or you are not the guide' }, { status: 404 });
		}

		// Check if trip is already completed
		if (trip.status === 'completed') {
			return json({ error: 'Trip is already marked as completed' }, { status: 400 });
		}

		// Check if trip is in accepted status
		if (trip.status !== 'accepted') {
			return json({ error: 'Only accepted trips can be marked as completed' }, { status: 400 });
		}

		// Check if the trip end date has passed
		const endDate = new Date(trip.endDate);
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// For development/testing, allow marking as complete before end date
		// In production, uncomment the check below
		/*
		if (endDate > today) {
			return json({ error: 'Trip can only be marked as completed after the end date' }, { status: 400 });
		}
		*/

		// Update trip status to completed
		await db
			.update(trips)
			.set({
				status: 'completed',
				statusUpdatedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(trips.id, tripId));

		// Add to status history
		await db.insert(tripStatusHistory).values({
			tripId,
			status: 'completed',
			changedBy: session.user.id
		});

		return json({ success: true, message: 'Trip marked as completed successfully' });
	} catch (error) {
		console.error('Error marking trip as completed:', error);
		return json({ error: 'Failed to mark trip as completed' }, { status: 500 });
	}
};

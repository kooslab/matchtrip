import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	// Check if user is admin
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Unauthorized');
	}

	const { id } = params;
	const body = await request.json();

	try {
		// Update trip
		const result = await db
			.update(trips)
			.set({
				destination: body.destination,
				startDate: body.startDate ? new Date(body.startDate) : null,
				endDate: body.endDate ? new Date(body.endDate) : null,
				people: body.people,
				tourType: body.tourType,
				budget: body.budget ? parseFloat(body.budget) : null,
				status: body.status,
				updatedAt: new Date()
			})
			.where(eq(trips.id, id))
			.returning();

		if (result.length === 0) {
			throw error(404, 'Trip not found');
		}

		return json({ success: true, trip: result[0] });
	} catch (err) {
		console.error('Error updating trip:', err);
		throw error(500, 'Failed to update trip');
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	// Check if user is admin
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Unauthorized');
	}

	const { id } = params;

	try {
		// Check if trip has payments (which would prevent deletion)
		const tripWithPayments = await db.query.trips.findFirst({
			where: eq(trips.id, id),
			with: {
				payments: true
			}
		});

		if (!tripWithPayments) {
			throw error(404, 'Trip not found');
		}

		if (tripWithPayments.payments && tripWithPayments.payments.length > 0) {
			throw error(400, 'Cannot delete trip with existing payments. Please handle payments first.');
		}

		// Delete the trip (cascade will handle related records)
		const result = await db
			.delete(trips)
			.where(eq(trips.id, id))
			.returning();

		if (result.length === 0) {
			throw error(404, 'Trip not found');
		}

		return json({ success: true });
	} catch (err) {
		console.error('Error deleting trip:', err);
		if (err instanceof Error && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to delete trip');
	}
};
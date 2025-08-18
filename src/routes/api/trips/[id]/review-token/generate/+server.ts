import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, trips, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;

	if (!session || !session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const tripId = params.id;

	try {
		// First, verify that this trip belongs to the user
		const [trip] = await db
			.select()
			.from(trips)
			.where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
			.limit(1);

		if (!trip) {
			return json({ error: 'Trip not found' }, { status: 404 });
		}

		// Check if trip has ended
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endDate = new Date(trip.endDate);
		endDate.setHours(0, 0, 0, 0);

		if (endDate > today) {
			return json({ error: 'Trip has not ended yet' }, { status: 400 });
		}

		// Find the accepted offer for this trip
		const [acceptedOffer] = await db
			.select()
			.from(offers)
			.where(and(eq(offers.tripId, tripId), eq(offers.status, 'accepted')))
			.limit(1);

		if (!acceptedOffer) {
			return json({ error: 'No accepted offer for this trip' }, { status: 400 });
		}

		// Check if review already exists
		const [existingReview] = await db
			.select()
			.from(reviews)
			.where(
				and(
					eq(reviews.tripId, tripId),
					eq(reviews.offerId, acceptedOffer.id),
					eq(reviews.travelerId, session.user.id)
				)
			)
			.limit(1);

		// If review already exists and has content, it's already submitted
		if (existingReview && existingReview.content) {
			return json(
				{
					error: 'Review already submitted',
					reviewToken: existingReview.reviewToken
				},
				{ status: 400 }
			);
		}

		// If review exists but no content (guide requested it), return the token
		if (existingReview && existingReview.reviewToken) {
			return json({
				reviewToken: existingReview.reviewToken,
				message: 'Review token already exists'
			});
		}

		// Generate a new review token
		const reviewToken = nanoid(32);

		if (existingReview) {
			// Update existing review with token
			await db
				.update(reviews)
				.set({
					reviewToken,
					updatedAt: new Date()
				})
				.where(eq(reviews.id, existingReview.id));
		} else {
			// Create new review record
			await db.insert(reviews).values({
				tripId,
				offerId: acceptedOffer.id,
				guideId: acceptedOffer.guideId,
				travelerId: session.user.id,
				rating: 0, // Will be updated when review is submitted
				content: '', // Will be updated when review is submitted
				reviewToken,
				// Note: Not setting reviewRequestedAt since this is traveler-initiated
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		return json({
			reviewToken,
			message: 'Review token generated successfully'
		});
	} catch (error) {
		console.error('Error generating review token:', error);
		return json({ error: 'Failed to generate review token' }, { status: 500 });
	}
};

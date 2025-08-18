import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, trips, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
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

		// Find the accepted offer for this trip
		const [acceptedOffer] = await db
			.select()
			.from(offers)
			.where(and(eq(offers.tripId, tripId), eq(offers.status, 'accepted')))
			.limit(1);

		if (!acceptedOffer) {
			return json({ reviewToken: null, message: 'No accepted offer for this trip' });
		}

		// Find the review for this trip and offer
		const [review] = await db
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

		if (!review) {
			return json({ reviewToken: null, message: 'Review not yet requested by guide' });
		}

		// Check if review is already submitted
		if (review.content && review.rating > 0) {
			return json({
				reviewToken: review.reviewToken,
				isSubmitted: true,
				message: 'Review already submitted'
			});
		}

		return json({
			reviewToken: review.reviewToken,
			isSubmitted: false
		});
	} catch (error) {
		console.error('Error fetching review token:', error);
		return json({ error: 'Failed to fetch review token' }, { status: 500 });
	}
};

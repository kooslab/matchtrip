import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { reviews, trips, offers, users, guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(303, '/login');
	}

	const { token } = params;

	// Find the review by token
	const review = await db
		.select({
			review: reviews,
			trip: trips,
			offer: offers,
			guide: users,
			guideProfile: guideProfiles
		})
		.from(reviews)
		.leftJoin(trips, eq(reviews.tripId, trips.id))
		.leftJoin(offers, eq(reviews.offerId, offers.id))
		.leftJoin(users, eq(reviews.guideId, users.id))
		.leftJoin(guideProfiles, eq(reviews.guideId, guideProfiles.userId))
		.where(eq(reviews.reviewToken, token))
		.then((rows) => rows[0]);

	if (!review) {
		throw redirect(303, '/my-trips');
	}

	// Check if the current user is the traveler for this review
	if (review.review.travelerId !== user.id) {
		throw redirect(303, '/my-trips');
	}

	// Check if review is not submitted yet
	if (!review.review.content || review.review.rating === 0) {
		throw redirect(303, `/write-review/${token}`);
	}

	return {
		review: review.review,
		trip: review.trip,
		offer: review.offer,
		guide: review.guide,
		guideProfile: review.guideProfile
	};
};

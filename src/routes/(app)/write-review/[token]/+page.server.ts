import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	reviews,
	trips,
	offers,
	users,
	guideProfiles,
	destinations,
	countries,
	products,
	productOffers
} from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { user } = await parent();
	if (!user) {
		throw redirect(303, '/login');
	}

	const { token } = params;

	// Find the review by token
	const reviewData = await db
		.select()
		.from(reviews)
		.where(eq(reviews.reviewToken, token))
		.then((rows) => rows[0]);

	if (!reviewData) {
		throw redirect(303, '/my-trips');
	}

	// Check if the current user is the traveler for this review
	if (reviewData.travelerId !== user.id) {
		throw redirect(303, '/my-trips');
	}

	// Check if review is already submitted (has content)
	if (reviewData.content && reviewData.rating > 0) {
		throw redirect(303, `/write-review/${token}/complete`);
	}

	// Check if this is a trip review or product review
	if (reviewData.tripId) {
		// Trip review - get trip and offer details
		const review = await db
			.select({
				review: reviews,
				trip: trips,
				offer: offers,
				guide: users,
				guideProfile: guideProfiles,
				destination: {
					id: destinations.id,
					city: destinations.city
				},
				country: {
					name: countries.name
				}
			})
			.from(reviews)
			.leftJoin(trips, eq(reviews.tripId, trips.id))
			.leftJoin(offers, eq(reviews.offerId, offers.id))
			.leftJoin(users, eq(reviews.guideId, users.id))
			.leftJoin(guideProfiles, eq(reviews.guideId, guideProfiles.userId))
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.where(eq(reviews.reviewToken, token))
			.then((rows) => rows[0]);

		return {
			review: review.review,
			trip: review.trip,
			offer: review.offer,
			guide: review.guide,
			guideProfile: review.guideProfile,
			destination: review.destination,
			country: review.country,
			reviewType: 'trip'
		};
	} else if (reviewData.productId) {
		// Product review - get product details
		const review = await db
			.select({
				review: reviews,
				product: products,
				productOffer: productOffers,
				guide: users,
				guideProfile: guideProfiles
			})
			.from(reviews)
			.leftJoin(products, eq(reviews.productId, products.id))
			.leftJoin(productOffers, eq(reviews.productOfferId, productOffers.id))
			.leftJoin(users, eq(reviews.guideId, users.id))
			.leftJoin(guideProfiles, eq(reviews.guideId, guideProfiles.userId))
			.where(eq(reviews.reviewToken, token))
			.then((rows) => rows[0]);

		return {
			review: review.review,
			product: review.product,
			productOffer: review.productOffer,
			guide: review.guide,
			guideProfile: review.guideProfile,
			reviewType: 'product'
		};
	} else {
		// Invalid review - no trip or product associated
		throw redirect(303, '/my-trips');
	}
};

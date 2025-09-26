import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, users, trips, destinations, products } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';

export const GET: RequestHandler = async ({ params }) => {
	const guideId = params.id;

	if (!guideId) {
		return json({ error: 'Guide ID is required' }, { status: 400 });
	}

	try {
		// Fetch all reviews for this guide
		const guideReviews = await db
			.select({
				id: reviews.id,
				rating: reviews.rating,
				content: reviews.content,
				images: reviews.images,
				tags: reviews.tags,
				createdAt: reviews.createdAt,
				travelerId: reviews.travelerId,
				travelerName: users.name,
				tripId: reviews.tripId,
				productId: reviews.productId,
				tripDestination: destinations.city,
				productTitle: products.title
			})
			.from(reviews)
			.leftJoin(users, eq(reviews.travelerId, users.id))
			.leftJoin(trips, eq(reviews.tripId, trips.id))
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(products, eq(reviews.productId, products.id))
			.where(eq(reviews.guideId, guideId))
			.orderBy(desc(reviews.createdAt));

		// Decrypt traveler names
		const decryptedReviews = guideReviews.map(review => ({
			...review,
			travelerName: review.travelerName ? decryptUserFields({ name: review.travelerName }).name : null,
			tripDestination: review.tripDestination || review.productTitle
		}));

		// Calculate statistics
		const totalReviews = decryptedReviews.length;
		const averageRating = totalReviews > 0
			? decryptedReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
			: 0;

		// Calculate rating distribution
		const ratingDistribution = {
			5: 0,
			4: 0,
			3: 0,
			2: 0,
			1: 0
		};

		decryptedReviews.forEach(review => {
			if (review.rating >= 1 && review.rating <= 5) {
				ratingDistribution[review.rating]++;
			}
		});

		return json({
			reviews: decryptedReviews,
			stats: {
				totalReviews,
				averageRating: Math.round(averageRating * 10) / 10,
				ratingDistribution
			}
		});
	} catch (error) {
		console.error('Error fetching guide reviews:', error);
		return json({ error: 'Failed to fetch reviews' }, { status: 500 });
	}
};
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers, payments, reviews, trips, products } from '$lib/server/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	const guideId = params.id;

	if (!guideId) {
		return json({ error: 'Guide ID is required' }, { status: 400 });
	}

	try {
		// Get completed trips count (trips with completed payments by this guide)
		const completedTripsResult = await db
			.select({
				count: sql<number>`COUNT(DISTINCT ${trips.id})::int`
			})
			.from(trips)
			.innerJoin(offers, eq(offers.tripId, trips.id))
			.innerJoin(payments, eq(payments.offerId, offers.id))
			.where(
				and(
					eq(offers.guideId, guideId),
					eq(offers.status, 'accepted'),
					eq(payments.status, 'completed')
				)
			);

		// Get active products count
		const activeProductsResult = await db
			.select({
				count: sql<number>`COUNT(*)::int`
			})
			.from(products)
			.where(and(eq(products.guideId, guideId), eq(products.status, 'active')));

		// Get average rating and review count
		const reviewStatsResult = await db
			.select({
				avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)::float`,
				reviewCount: sql<number>`COUNT(*)::int`
			})
			.from(reviews)
			.where(eq(reviews.guideId, guideId));

		const completedTrips = completedTripsResult[0]?.count || 0;
		const activeProducts = activeProductsResult[0]?.count || 0;
		const avgRating = reviewStatsResult[0]?.avgRating || 0;
		const reviewCount = reviewStatsResult[0]?.reviewCount || 0;

		// Round rating to 1 decimal place
		const rating = Math.round(avgRating * 10) / 10;

		return json({
			completedTrips,
			activeProducts,
			rating,
			reviewCount
		});
	} catch (error) {
		console.error('Error fetching guide stats:', error);
		return json({ error: 'Failed to fetch guide statistics' }, { status: 500 });
	}
};
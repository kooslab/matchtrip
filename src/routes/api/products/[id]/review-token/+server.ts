import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, products, payments, productOffers } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;

	if (!session || !session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const productId = params.id;

	try {
		// First, find payments for this product by the user
		const [payment] = await db
			.select()
			.from(payments)
			.where(
				and(
					eq(payments.productId, productId),
					eq(payments.userId, session.user.id),
					eq(payments.status, 'completed')
				)
			)
			.limit(1);

		if (!payment) {
			return json({ error: 'No payment found for this product' }, { status: 404 });
		}

		// Get product details
		const [product] = await db
			.select()
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (!product) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		// Find the review for this product
		const [review] = await db
			.select()
			.from(reviews)
			.where(
				and(
					eq(reviews.productId, productId),
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
		console.error('Error fetching product review token:', error);
		return json({ error: 'Failed to fetch review token' }, { status: 500 });
	}
};
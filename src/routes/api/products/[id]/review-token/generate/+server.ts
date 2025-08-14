import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, payments, productOffers, products } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;

	if (!session || !session.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const productId = params.id;

	try {
		// Find the product payment for this user and product
		const [payment] = await db
			.select({
				id: payments.id,
				productOfferId: payments.productOfferId,
				status: payments.status,
				endDate: productOffers.endDate,
				guideId: productOffers.guideId
			})
			.from(payments)
			.innerJoin(productOffers, eq(payments.productOfferId, productOffers.id))
			.where(
				and(
					eq(payments.productId, productId),
					eq(payments.userId, session.user.id),
					eq(payments.status, 'completed')
				)
			)
			.limit(1);

		if (!payment) {
			return json({ error: 'No completed payment found for this product' }, { status: 404 });
		}

		// Check if product has ended
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endDate = new Date(payment.endDate);
		endDate.setHours(0, 0, 0, 0);
		
		if (endDate > today) {
			return json({ error: 'Product experience has not ended yet' }, { status: 400 });
		}

		// Check if review already exists
		const [existingReview] = await db
			.select()
			.from(reviews)
			.where(
				and(
					eq(reviews.productId, productId),
					eq(reviews.productOfferId, payment.productOfferId),
					eq(reviews.travelerId, session.user.id)
				)
			)
			.limit(1);

		// If review already exists and has content, it's already submitted
		if (existingReview && existingReview.content) {
			return json({ 
				error: 'Review already submitted',
				reviewToken: existingReview.reviewToken 
			}, { status: 400 });
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
				productId,
				productOfferId: payment.productOfferId,
				guideId: payment.guideId,
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
		console.error('Error generating product review token:', error);
		return json({ error: 'Failed to generate review token' }, { status: 500 });
	}
};
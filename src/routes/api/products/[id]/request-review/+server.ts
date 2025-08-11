import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { products, reviews, productConversations, productMessages, payments, productOffers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const productId = params.id;

	try {
		// Get the product details
		const [product] = await db
			.select()
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (!product) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		// Verify the current user is the guide for this product
		if (product.guideId !== user.id) {
			return json({ error: 'You are not the guide for this product' }, { status: 403 });
		}

		// Find completed payments for this product
		const completedPayments = await db
			.select()
			.from(payments)
			.where(
				and(
					eq(payments.productId, productId),
					eq(payments.status, 'completed')
				)
			);

		if (completedPayments.length === 0) {
			return json({ error: 'No completed payments found for this product' }, { status: 404 });
		}

		let reviewsCreated = 0;
		let reviewsAlreadyRequested = 0;

		// Process each payment and create review requests
		for (const payment of completedPayments) {
			// Check if review already exists for this traveler and product
			const [existingReview] = await db
				.select()
				.from(reviews)
				.where(
					and(
						eq(reviews.productId, productId),
						eq(reviews.travelerId, payment.userId)
					)
				)
				.limit(1);

			if (existingReview && existingReview.reviewRequestedAt) {
				reviewsAlreadyRequested++;
				continue;
			}

			// Generate a unique review token
			const reviewToken = nanoid(32);

			// Create or update review record with request timestamp
			if (existingReview) {
				await db
					.update(reviews)
					.set({
						reviewRequestedAt: new Date(),
						reviewToken,
						updatedAt: new Date()
					})
					.where(eq(reviews.id, existingReview.id));
			} else {
				await db.insert(reviews).values({
					productId: product.id,
					productOfferId: payment.productOfferId,
					guideId: user.id,
					travelerId: payment.userId,
					rating: 0, // Will be updated when review is submitted
					content: '', // Will be updated when review is submitted
					reviewToken,
					reviewRequestedAt: new Date()
				});
			}

			// Find conversation for this product and traveler
			const [conversation] = await db
				.select()
				.from(productConversations)
				.where(
					and(
						eq(productConversations.productId, productId),
						eq(productConversations.travelerId, payment.userId)
					)
				)
				.limit(1);

			if (conversation) {
				// Send automatic message in the conversation
				const reviewUrl = `/write-review/${reviewToken}`;
				const messageContent = `상품을 이용해주셔서 감사합니다! 리뷰를 작성해주시면 다른 여행자들에게 큰 도움이 됩니다.\n\n[리뷰 작성하기](${reviewUrl})`;

				await db.insert(productMessages).values({
					conversationId: conversation.id,
					senderId: user.id,
					content: messageContent,
					messageType: 'text'
				});

				// Update conversation's last message timestamp
				await db
					.update(productConversations)
					.set({
						lastMessageAt: new Date(),
						updatedAt: new Date()
					})
					.where(eq(productConversations.id, conversation.id));
			}

			reviewsCreated++;
		}

		return json({
			success: true,
			message: `Review requests sent successfully`,
			reviewsCreated,
			reviewsAlreadyRequested
		});
	} catch (error) {
		console.error('Error requesting product review:', error);
		return json({ error: 'Failed to request review' }, { status: 500 });
	}
};
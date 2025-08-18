import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers, reviews, conversations, messages, payments, trips } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const offerId = params.id;

	try {
		// Get the offer details
		const [offer] = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);

		if (!offer) {
			return json({ error: 'Offer not found' }, { status: 404 });
		}

		// Verify the current user is the guide for this offer
		if (offer.guideId !== user.id) {
			return json({ error: 'You are not the guide for this offer' }, { status: 403 });
		}

		// Find completed payment for this offer
		const [payment] = await db
			.select()
			.from(payments)
			.where(and(eq(payments.offerId, offerId), eq(payments.status, 'completed')))
			.limit(1);

		if (!payment) {
			return json({ error: 'No completed payment found for this offer' }, { status: 404 });
		}

		// Get trip details to find the traveler
		const [trip] = await db.select().from(trips).where(eq(trips.id, offer.tripId)).limit(1);

		if (!trip) {
			return json({ error: 'Trip not found' }, { status: 404 });
		}

		// Check if review already exists for this traveler and offer
		const [existingReview] = await db
			.select()
			.from(reviews)
			.where(and(eq(reviews.offerId, offerId), eq(reviews.travelerId, trip.userId)))
			.limit(1);

		let reviewToken = existingReview?.reviewToken;

		if (existingReview && existingReview.reviewRequestedAt) {
			// Update the existing review request timestamp
			await db
				.update(reviews)
				.set({
					reviewRequestedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(reviews.id, existingReview.id));
		} else if (existingReview) {
			// Update existing review with request timestamp
			await db
				.update(reviews)
				.set({
					reviewRequestedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(reviews.id, existingReview.id));
		} else {
			// Generate a unique review token
			reviewToken = nanoid(32);

			// Create new review record with request timestamp
			await db.insert(reviews).values({
				tripId: offer.tripId,
				offerId: offer.id,
				guideId: user.id,
				travelerId: trip.userId,
				rating: 0, // Will be updated when review is submitted
				content: '', // Will be updated when review is submitted
				reviewToken,
				reviewRequestedAt: new Date()
			});
		}

		// Find conversation for this offer
		const [conversation] = await db
			.select()
			.from(conversations)
			.where(eq(conversations.offerId, offerId))
			.limit(1);

		if (conversation && reviewToken) {
			// Send automatic message in the conversation
			const reviewUrl = `/write-review/${reviewToken}`;
			const messageContent = `여행을 함께 해주셔서 감사합니다! 리뷰를 작성해주시면 다른 여행자들에게 큰 도움이 됩니다.\n\n[리뷰 작성하기](${reviewUrl})`;

			await db.insert(messages).values({
				conversationId: conversation.id,
				senderId: user.id,
				content: messageContent,
				messageType: 'text'
			});

			// Update conversation's last message timestamp
			await db
				.update(conversations)
				.set({
					lastMessageAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(conversations.id, conversation.id));
		}

		return json({
			success: true,
			message: '리뷰 요청이 전송되었습니다.'
		});
	} catch (error) {
		console.error('Error requesting offer review:', error);
		return json({ error: 'Failed to request review' }, { status: 500 });
	}
};

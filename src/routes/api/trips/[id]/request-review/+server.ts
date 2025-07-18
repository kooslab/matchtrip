import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db/drizzle';
import { trips, offers, reviews, conversations, messages } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const POST: RequestHandler = async ({ request, params, cookies }) => {
	const session = await auth.api.getSession({ headers: cookies });
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const tripId = params.id;

	try {
		// Get the trip and offer details
		const trip = await db
			.select()
			.from(trips)
			.where(eq(trips.id, tripId))
			.then(rows => rows[0]);

		if (!trip) {
			return json({ error: 'Trip not found' }, { status: 404 });
		}

		// Get the accepted offer for this trip where the current user is the guide
		const offer = await db
			.select()
			.from(offers)
			.where(
				and(
					eq(offers.tripId, tripId),
					eq(offers.guideId, session.user.id),
					eq(offers.status, 'accepted')
				)
			)
			.then(rows => rows[0]);

		if (!offer) {
			return json({ error: 'No accepted offer found for this trip' }, { status: 404 });
		}

		// Check if trip has ended
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endDate = new Date(trip.endDate);
		endDate.setHours(0, 0, 0, 0);
		
		if (endDate > today) {
			return json({ error: 'Trip has not ended yet' }, { status: 400 });
		}

		// Check if review already exists or was requested
		const existingReview = await db
			.select()
			.from(reviews)
			.where(
				and(
					eq(reviews.tripId, tripId),
					eq(reviews.offerId, offer.id)
				)
			)
			.then(rows => rows[0]);

		if (existingReview && existingReview.reviewRequestedAt) {
			return json({ error: 'Review already requested' }, { status: 400 });
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
				tripId: trip.id,
				offerId: offer.id,
				guideId: session.user.id,
				travelerId: trip.userId,
				rating: 0, // Will be updated when review is submitted
				content: '', // Will be updated when review is submitted
				reviewToken,
				reviewRequestedAt: new Date()
			});
		}

		// Find or create conversation for this offer
		const conversation = await db
			.select()
			.from(conversations)
			.where(eq(conversations.offerId, offer.id))
			.then(rows => rows[0]);

		if (conversation) {
			// Send automatic message in the conversation
			const reviewUrl = `/write-review/${reviewToken}`;
			const messageContent = `여행이 즐거우셨나요? 가이드가 리뷰 작성을 요청했습니다. 아래 링크를 클릭하여 리뷰를 작성해주세요.\n\n[리뷰 작성하기](${reviewUrl})`;

			await db.insert(messages).values({
				conversationId: conversation.id,
				senderId: session.user.id,
				content: messageContent
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
			message: 'Review request sent successfully',
			reviewToken 
		});
	} catch (error) {
		console.error('Error requesting review:', error);
		return json({ error: 'Failed to request review' }, { status: 500 });
	}
};
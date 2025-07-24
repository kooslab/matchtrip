import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { messages, payments, offers, trips } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Only travelers can respond to cancellation requests
	if (user.role !== 'traveler') {
		return json({ error: 'Only travelers can respond to cancellation requests' }, { status: 403 });
	}

	const body = await request.json();
	const { messageId, response, paymentId, offerId } = body;

	if (!messageId || !response || !paymentId || !offerId) {
		return json({ error: 'Missing required fields' }, { status: 400 });
	}

	if (response !== 'accepted' && response !== 'declined') {
		return json({ error: 'Invalid response' }, { status: 400 });
	}

	try {
		// Get the original cancellation request message
		const originalMessage = await db
			.select()
			.from(messages)
			.where(eq(messages.id, messageId))
			.limit(1);

		if (originalMessage.length === 0) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		const message = originalMessage[0];

		// Update the original message metadata to reflect the response
		await db
			.update(messages)
			.set({
				metadata: {
					...message.metadata,
					status: response === 'accepted' ? 'accepted' : 'declined',
					respondedAt: new Date().toISOString()
				},
				updatedAt: new Date()
			})
			.where(eq(messages.id, messageId));

		// Create a response message
		await db.insert(messages).values({
			conversationId: message.conversationId,
			senderId: user.id,
			content: response === 'accepted' 
				? '취소 요청이 승인되었습니다.' 
				: '취소 요청이 거절되었습니다.',
			messageType: 'cancellation_response',
			metadata: {
				originalMessageId: messageId,
				response,
				paymentId,
				offerId
			}
		});

		// If accepted, update payment and offer status
		if (response === 'accepted') {
			// Update payment status to cancelled
			await db
				.update(payments)
				.set({
					status: 'cancelled',
					updatedAt: new Date()
				})
				.where(eq(payments.id, paymentId));

			// Update offer status back to pending
			await db
				.update(offers)
				.set({
					status: 'pending',
					updatedAt: new Date()
				})
				.where(eq(offers.id, offerId));

			// Get the trip ID from the offer
			const offer = await db
				.select()
				.from(offers)
				.where(eq(offers.id, offerId))
				.limit(1);

			if (offer.length > 0) {
				// Update trip status back to submitted
				await db
					.update(trips)
					.set({
						status: 'submitted',
						updatedAt: new Date()
					})
					.where(eq(trips.id, offer[0].tripId));
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error processing cancellation response:', error);
		return json({ error: 'Failed to process response' }, { status: 500 });
	}
};
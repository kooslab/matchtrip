import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import {
	offers,
	trips,
	payments,
	users,
	destinations,
	conversations,
	messages
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		throw redirect(302, '/');
	}

	if (user.role !== 'guide') {
		throw redirect(302, '/');
	}

	// Get the order details
	const orderData = await db
		.select({
			offer: offers,
			trip: trips,
			payment: payments,
			traveler: users,
			destination: destinations
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.leftJoin(payments, eq(payments.offerId, offers.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.where(and(eq(offers.id, params.id), eq(offers.guideId, user.id)))
		.limit(1);

	if (orderData.length === 0) {
		throw redirect(302, '/profile/guide/orders');
	}

	return {
		order: orderData[0]
	};
};

export const actions = {
	cancelPayment: async ({ params, locals, request }) => {
		const session = locals.session;
		const user = locals.user;

		if (!session || !user || user.role !== 'guide') {
			return fail(403, { error: '권한이 없습니다.' });
		}

		const formData = await request.formData();
		const cancelReason = formData.get('cancelReason') as string;

		// Get the payment details
		const paymentData = await db
			.select({
				payment: payments,
				offer: offers
			})
			.from(payments)
			.innerJoin(offers, eq(payments.offerId, offers.id))
			.where(and(eq(offers.id, params.id), eq(offers.guideId, user.id)))
			.limit(1);

		if (paymentData.length === 0) {
			return fail(404, { error: '결제 정보를 찾을 수 없습니다.' });
		}

		const payment = paymentData[0].payment;

		if (payment.status !== 'completed') {
			return fail(400, { error: '완료된 결제만 취소할 수 있습니다.' });
		}

		try {
			// Find the conversation for this offer
			const conversation = await db
				.select()
				.from(conversations)
				.where(eq(conversations.offerId, params.id))
				.limit(1);

			if (conversation.length === 0) {
				return fail(404, { error: '대화를 찾을 수 없습니다.' });
			}

			// Create a cancellation request message in the conversation
			await db.insert(messages).values({
				conversationId: conversation[0].id,
				senderId: user.id,
				content: `취소 요청: ${cancelReason}`,
				messageType: 'cancellation_request',
				metadata: {
					paymentId: payment.id,
					offerId: params.id,
					reason: cancelReason,
					status: 'pending'
				}
			});

			// Update conversation last message time
			await db
				.update(conversations)
				.set({
					lastMessageAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(conversations.id, conversation[0].id));

			// Note: We don't update payment status here - wait for traveler confirmation

			return { success: true };
		} catch (error) {
			console.error('Payment cancellation error:', error);
			return fail(500, { error: '결제 취소 중 오류가 발생했습니다.' });
		}
	}
} satisfies Actions;

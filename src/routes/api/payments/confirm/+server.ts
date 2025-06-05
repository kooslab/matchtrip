import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers, trips, payments } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const { paymentKey, orderId, amount, offerId } = await request.json();

		if (!paymentKey || !orderId || !amount || !offerId) {
			return json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		// Get offer details
		const offer = await db.query.offers.findFirst({
			where: eq(offers.id, offerId),
			with: {
				trip: true
			}
		});

		if (!offer) {
			return json({ success: false, error: '제안을 찾을 수 없습니다.' }, { status: 404 });
		}

		// Verify the offer belongs to the user's trip
		if (offer.trip.userId !== user.id) {
			return json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
		}

		// Verify amount matches
		if (offer.price !== amount) {
			return json({ success: false, error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
		}

		// TODO: Call Toss Payments API to confirm payment
		// For test environment, we'll simulate success
		const tossPaymentResponse = await confirmTossPayment(paymentKey, orderId, amount);
		
		if (!tossPaymentResponse.success) {
			return json({ 
				success: false, 
				error: tossPaymentResponse.error || '결제 승인에 실패했습니다.' 
			}, { status: 400 });
		}

		// Start transaction to update offer and trip status
		await db.transaction(async (tx) => {
			// Update offer status to accepted
			await tx.update(offers)
				.set({ 
					status: 'accepted',
					updatedAt: new Date()
				})
				.where(eq(offers.id, offerId));

			// Update trip status to accepted
			await tx.update(trips)
				.set({ 
					status: 'accepted',
					updatedAt: new Date()
				})
				.where(eq(trips.id, offer.tripId));

			// Record payment in database
			await tx.insert(payments).values({
				id: crypto.randomUUID(),
				tripId: offer.tripId,
				offerId: offerId,
				userId: user.id,
				amount: amount,
				paymentKey: paymentKey,
				orderId: orderId,
				status: 'completed',
				paymentMethod: 'card', // Default for now
				createdAt: new Date()
			});

			// Reject all other pending offers for this trip
			await tx.update(offers)
				.set({ 
					status: 'rejected',
					updatedAt: new Date()
				})
				.where(
					and(
						eq(offers.tripId, offer.tripId),
						eq(offers.status, 'pending'),
						// Don't update the accepted offer
						offers.id !== offerId
					)
				);
		});

		return json({ 
			success: true, 
			message: '결제가 완료되었습니다.',
			tripId: offer.tripId
		});

	} catch (error) {
		console.error('Payment confirmation error:', error);
		return json({ 
			success: false, 
			error: '결제 처리 중 오류가 발생했습니다.' 
		}, { status: 500 });
	}
};

// Mock function for Toss Payments API
async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
	// TODO: Implement actual Toss Payments API call
	// For now, simulate success in test environment
	
	try {
		// In production, you would call:
		// const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
		//   method: 'POST',
		//   headers: {
		//     'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
		//     'Content-Type': 'application/json',
		//   },
		//   body: JSON.stringify({
		//     paymentKey,
		//     orderId,
		//     amount,
		//   }),
		// });
		
		// Simulate API call delay
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// For test environment, always return success
		return {
			success: true,
			data: {
				paymentKey,
				orderId,
				amount,
				approvedAt: new Date().toISOString()
			}
		};
	} catch (error) {
		console.error('Toss payment confirmation error:', error);
		return {
			success: false,
			error: '결제 승인 API 호출에 실패했습니다.'
		};
	}
}
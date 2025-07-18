import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers, trips, payments } from '$lib/server/db/schema';
import { eq, and, ne } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const { paymentKey, orderId, amount, offerId } = await request.json();

		console.log('Payment confirmation request received:', {
			paymentKey,
			orderId,
			amount,
			offerId,
			userId: user.id
		});

		if (!paymentKey || !orderId || !amount || !offerId) {
			return json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		// Get offer details with trip information
		const offer = await db
			.select({
				id: offers.id,
				tripId: offers.tripId,
				price: offers.price,
				status: offers.status,
				trip: {
					id: trips.id,
					userId: trips.userId
				}
			})
			.from(offers)
			.innerJoin(trips, eq(offers.tripId, trips.id))
			.where(eq(offers.id, offerId))
			.limit(1);

		if (!offer.length) {
			return json({ success: false, error: '제안을 찾을 수 없습니다.' }, { status: 404 });
		}

		const offerData = offer[0];

		console.log('Current offer status before update:', offerData.status);
		console.log('Offer ID:', offerId);
		console.log('Trip ID:', offerData.tripId);

		// Verify the offer belongs to the user's trip
		if (offerData.trip.userId !== user.id) {
			return json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
		}

		// Verify amount matches
		if (offerData.price !== amount) {
			return json({ success: false, error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
		}

		// TODO: Call Toss Payments API to confirm payment
		// For test environment, we'll simulate success
		console.log('Calling Toss payment confirmation...');
		const tossPaymentResponse = await confirmTossPayment(paymentKey, orderId, amount);

		if (!tossPaymentResponse.success) {
			console.error('Toss payment confirmation failed:', tossPaymentResponse.error);
			return json(
				{
					success: false,
					error: tossPaymentResponse.error || '결제 승인에 실패했습니다.'
				},
				{ status: 400 }
			);
		}

		console.log('Toss payment confirmed successfully');

		// Start transaction to update offer and trip status
		await db.transaction(async (tx) => {
			console.log('Starting transaction - updating offer:', offerId);
			// Update offer status to accepted
			await tx
				.update(offers)
				.set({
					status: 'accepted',
					updatedAt: new Date()
				})
				.where(eq(offers.id, offerId));

			console.log('Updating trip status for tripId:', offerData.tripId);
			// Update trip status to accepted
			await tx
				.update(trips)
				.set({
					status: 'accepted',
					statusUpdatedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(trips.id, offerData.tripId));

			// Record payment in database
			await tx.insert(payments).values({
				id: crypto.randomUUID(),
				tripId: offerData.tripId,
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
			await tx
				.update(offers)
				.set({
					status: 'rejected',
					updatedAt: new Date()
				})
				.where(
					and(
						eq(offers.tripId, offerData.tripId),
						eq(offers.status, 'pending'),
						ne(offers.id, offerId) // Use ne instead of !== for SQL comparison
					)
				);
		});

		// Verify the updates worked
		console.log('Transaction completed - verifying status updates');

		const updatedTrip = await db
			.select({ status: trips.status })
			.from(trips)
			.where(eq(trips.id, offerData.tripId))
			.limit(1);

		const updatedOffer = await db
			.select({ status: offers.status })
			.from(offers)
			.where(eq(offers.id, offerId))
			.limit(1);

		console.log('Updated trip status:', updatedTrip[0]?.status);
		console.log('Updated offer status:', updatedOffer[0]?.status);

		return json({
			success: true,
			message: '결제가 완료되었습니다.',
			tripId: offerData.tripId
		});
	} catch (error) {
		console.error('Payment confirmation error:', error);
		console.error('Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined
		});
		return json(
			{
				success: false,
				error: '결제 처리 중 오류가 발생했습니다.'
			},
			{ status: 500 }
		);
	}
};

// Toss Payments API confirmation
async function confirmTossPayment(paymentKey: string, orderId: string, amount: number) {
	try {
		// Use secret key from environment variable
		const widgetSecretKey = process.env.TOSS_SECRET_KEY;
		if (!widgetSecretKey) {
			throw new Error('TOSS_SECRET_KEY is not configured');
		}
		const encryptedSecretKey = 'Basic ' + Buffer.from(widgetSecretKey + ':').toString('base64');

		const response = await fetch(`https://api.tosspayments.com/v1/payments/confirm`, {
			method: 'POST',
			headers: {
				Authorization: encryptedSecretKey,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				paymentKey: paymentKey,
				orderId: orderId,
				amount: amount
			})
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('Toss API error:', data);
			return {
				success: false,
				error: data.message || '결제 승인에 실패했습니다.'
			};
		}

		return {
			success: true,
			data: data
		};
	} catch (error) {
		console.error('Toss payment confirmation error:', error);
		return {
			success: false,
			error: '결제 승인 API 호출에 실패했습니다.'
		};
	}
}

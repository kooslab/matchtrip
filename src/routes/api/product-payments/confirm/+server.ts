import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { products, productOffers, payments, productMessages, productConversations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		if (!user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const { paymentKey, orderId, amount, productOfferId, productId } = await request.json();

		console.log('Product payment confirmation request received:', {
			paymentKey,
			orderId,
			amount,
			productOfferId,
			productId,
			userId: user.id
		});

		if (!paymentKey || !orderId || !amount || !productId) {
			return json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		// Get product details
		const [productData] = await db
			.select()
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (!productData) {
			return json({ success: false, error: '상품을 찾을 수 없습니다.' }, { status: 404 });
		}

		// If productOfferId is provided, get the offer details
		let offerData = null;
		if (productOfferId) {
			const [offer] = await db
				.select()
				.from(productOffers)
				.where(eq(productOffers.id, productOfferId))
				.limit(1);
			
			if (!offer) {
				// If productOfferId was provided but not found, it's an error
				return json({ success: false, error: '제안을 찾을 수 없습니다.' }, { status: 404 });
			}
			
			offerData = offer;
			
			// Verify amount matches the offer price
			if (amount !== offer.price) {
				return json({ success: false, error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
			}
		} else {
			// If no specific offer, verify amount matches product price
			if (amount !== productData.price) {
				return json({ success: false, error: '결제 금액이 일치하지 않습니다.' }, { status: 400 });
			}
		}

		// Confirm payment with Toss Payments API
		const tossSecretKey = env.TOSS_SECRET_KEY || process.env.TOSS_SECRET_KEY;
		if (!tossSecretKey) {
			console.error('TOSS_SECRET_KEY is not configured in environment variables');
			return json({ success: false, error: 'Payment configuration error' }, { status: 500 });
		}

		const tossResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
			method: 'POST',
			headers: {
				Authorization: `Basic ${Buffer.from(tossSecretKey + ':').toString('base64')}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				paymentKey,
				orderId,
				amount
			})
		});

		const tossData = await tossResponse.json();

		if (!tossResponse.ok) {
			console.error('Toss payment confirmation failed:', tossData);
			return json(
				{ success: false, error: tossData.message || '결제 확인에 실패했습니다.' },
				{ status: 400 }
			);
		}

		console.log('Toss payment confirmed successfully:', tossData);

		// Start a transaction to update database
		try {
			// Create payment record
			// Only include productOfferId if it's valid and exists in the database
			const [newPayment] = await db
				.insert(payments)
				.values({
					productId,
					productOfferId: offerData ? productOfferId : null,  // Only set if offer exists
					userId: user.id,
					amount,
					currency: 'KRW',
					paymentKey,
					orderId,
					status: 'completed',
					paymentMethod: tossData.method || 'card',
					paidAt: new Date()
				})
				.returning();

			console.log('Payment record created:', newPayment.id);

			// If there's a product offer, update its status to accepted
			if (offerData) {
				await db
					.update(productOffers)
					.set({
						status: 'accepted',
						acceptedAt: new Date()
					})
					.where(eq(productOffers.id, productOfferId));

				console.log('Product offer status updated to accepted');

				// Send a system message to the conversation
				if (offerData.conversationId) {
					await db
						.insert(productMessages)
						.values({
							conversationId: offerData.conversationId,
							senderId: user.id,
							content: '결제가 완료되었습니다. 가이드가 곧 연락드릴 예정입니다.',
							messageType: 'system'
						});

					// Update conversation's last message timestamp
					await db
						.update(productConversations)
						.set({
							lastMessageAt: new Date(),
							updatedAt: new Date()
						})
						.where(eq(productConversations.id, offerData.conversationId));
				}
			}

			return json({
				success: true,
				paymentId: newPayment.id,
				orderId,
				message: '결제가 성공적으로 완료되었습니다.'
			});

		} catch (dbError) {
			console.error('Database update failed:', dbError);
			
			// TODO: Should implement payment cancellation with Toss here
			// For now, just log the error
			
			return json(
				{ success: false, error: '결제 정보 저장에 실패했습니다. 고객센터에 문의해주세요.' },
				{ status: 500 }
			);
		}

	} catch (error) {
		console.error('Payment confirmation error:', error);
		return json(
			{ success: false, error: '결제 처리 중 오류가 발생했습니다.' },
			{ status: 500 }
		);
	}
};
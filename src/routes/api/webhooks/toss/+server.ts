import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { payments, paymentRefunds, webhookEvents, trips, offers, settlements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

// Webhook event types from Toss Payments
type WebhookEventType =
	| 'PAYMENT.DONE'
	| 'PAYMENT.CANCELED'
	| 'PAYMENT.PARTIAL_CANCELED'
	| 'PAYMENT.FAILED'
	| 'PAYMENT.EXPIRED';

interface TossWebhookPayload {
	eventType: WebhookEventType;
	eventId: string;
	timestamp: string;
	data: {
		paymentKey: string;
		orderId: string;
		status: string;
		transactionKey?: string;
		cancels?: Array<{
			transactionKey: string;
			cancelReason: string;
			canceledAt: string;
			cancelAmount: number;
			taxFreeAmount: number;
			taxExemptionAmount: number;
			refundableAmount: number;
			easyPayDiscountAmount: number;
			cancelStatus: string;
			cancelRequestId?: string;
		}>;
		totalAmount?: number;
		balanceAmount?: number;
		suppliedAmount?: number;
		vat?: number;
		requestedAt?: string;
		approvedAt?: string;
		method?: string;
		failure?: {
			code: string;
			message: string;
		};
	};
}

export const POST: RequestHandler = async ({ request }) => {
	console.log('[Webhook] Received Toss webhook request');

	try {
		// Parse webhook payload
		const payload: TossWebhookPayload = await request.json();

		console.log('[Webhook] Event received:', {
			eventType: payload.eventType,
			eventId: payload.eventId,
			paymentKey: payload.data.paymentKey
		});

		// Security: Verify the payment status with Toss API
		// This is more secure than signature verification
		// We'll verify the actual payment state matches what the webhook claims
		if (payload.data.paymentKey) {
			const isValid = await verifyPaymentWithTossAPI(payload.data.paymentKey, payload.data.status);
			if (!isValid) {
				console.error('[Webhook] Payment verification failed');
				throw error(401, 'Payment verification failed');
			}
		}

		console.log('[Webhook] Payment verified successfully');

		// Check for duplicate event (idempotency)
		const existingEvent = await db
			.select()
			.from(webhookEvents)
			.where(eq(webhookEvents.eventId, payload.eventId))
			.limit(1);

		if (existingEvent.length > 0) {
			console.log('[Webhook] Duplicate event, already processed:', payload.eventId);
			return json({ success: true, message: 'Already processed' });
		}

		// Store webhook event
		await db.insert(webhookEvents).values({
			eventId: payload.eventId,
			eventType: payload.eventType,
			payload: payload,
			status: 'pending'
		});

		// Process the event based on type
		try {
			await processWebhookEvent(payload);

			// Mark as processed
			await db
				.update(webhookEvents)
				.set({
					status: 'processed',
					processedAt: new Date()
				})
				.where(eq(webhookEvents.eventId, payload.eventId));

			console.log('[Webhook] Event processed successfully:', payload.eventId);
			return json({ success: true });
		} catch (processError) {
			console.error('[Webhook] Error processing event:', processError);

			// Mark as failed
			await db
				.update(webhookEvents)
				.set({
					status: 'failed',
					errorMessage: processError instanceof Error ? processError.message : 'Unknown error',
					retryCount: 1
				})
				.where(eq(webhookEvents.eventId, payload.eventId));

			// Still return 200 to prevent Toss from retrying immediately
			// We'll handle retries on our side
			return json({ success: false, error: 'Processing failed' });
		}
	} catch (err) {
		console.error('[Webhook] Fatal error:', err);

		if (err instanceof Error && 'status' in err) {
			throw err;
		}

		throw error(500, 'Internal server error');
	}
};

// Process webhook events based on type
async function processWebhookEvent(payload: TossWebhookPayload) {
	const { eventType, data } = payload;

	console.log(`[Webhook] Processing ${eventType} for payment ${data.paymentKey}`);

	// Find the payment record
	const [payment] = await db
		.select()
		.from(payments)
		.where(eq(payments.paymentKey, data.paymentKey))
		.limit(1);

	if (!payment) {
		console.error('[Webhook] Payment not found:', data.paymentKey);
		// Don't throw error for missing payments - they might be from test environment
		return;
	}

	switch (eventType) {
		case 'PAYMENT.DONE':
			await handlePaymentDone(payment, data);
			break;

		case 'PAYMENT.CANCELED':
			await handlePaymentCanceled(payment, data);
			break;

		case 'PAYMENT.PARTIAL_CANCELED':
			await handlePaymentPartialCanceled(payment, data);
			break;

		case 'PAYMENT.FAILED':
			await handlePaymentFailed(payment, data);
			break;

		case 'PAYMENT.EXPIRED':
			await handlePaymentExpired(payment, data);
			break;

		default:
			console.warn('[Webhook] Unhandled event type:', eventType);
	}
}

// Handle payment completion
async function handlePaymentDone(payment: any, data: any) {
	console.log('[Webhook] Processing PAYMENT.DONE');

	// Update payment status if not already completed
	if (payment.status !== 'completed') {
		await db.transaction(async (tx) => {
			// Update payment status
			await tx
				.update(payments)
				.set({
					status: 'completed',
					paidAt: new Date(data.approvedAt),
					paymentMethod: data.method,
					updatedAt: new Date()
				})
				.where(eq(payments.id, payment.id));

			// If trip payment, update trip and offer status
			if (payment.tripId && payment.offerId) {
				await tx
					.update(trips)
					.set({
						status: 'accepted',
						statusUpdatedAt: new Date(),
						updatedAt: new Date()
					})
					.where(eq(trips.id, payment.tripId));

				await tx
					.update(offers)
					.set({
						status: 'accepted',
						updatedAt: new Date()
					})
					.where(eq(offers.id, payment.offerId));
			}

			// Auto-create settlement record for completed payment
			const existingSettlement = await tx
				.select()
				.from(settlements)
				.where(eq(settlements.paymentId, payment.id))
				.limit(1);

			if (!existingSettlement[0]) {
				const DEFAULT_COMMISSION_RATE = 1000; // 10%
				const DEFAULT_TAX_RATE = 330; // 3.3%
				
				const paymentAmount = payment.amount;
				const commissionAmount = Math.floor(paymentAmount * (DEFAULT_COMMISSION_RATE / 10000));
				const taxAmount = Math.floor(paymentAmount * (DEFAULT_TAX_RATE / 10000));
				const settlementAmount = paymentAmount - commissionAmount - taxAmount;

				await tx.insert(settlements).values({
					paymentId: payment.id,
					commissionRate: DEFAULT_COMMISSION_RATE,
					commissionAmount,
					taxRate: DEFAULT_TAX_RATE,
					taxAmount,
					settlementAmount,
					status: 'pending'
				});

				console.log('[Webhook] Settlement record created for payment');
			}
		});

		console.log('[Webhook] Payment marked as completed');
	}
}

// Handle full payment cancellation
async function handlePaymentCanceled(payment: any, data: any) {
	console.log('[Webhook] Processing PAYMENT.CANCELED');

	const cancelInfo = data.cancels?.[0];
	if (!cancelInfo) {
		console.error('[Webhook] No cancel information in payload');
		return;
	}

	await db.transaction(async (tx) => {
		// Update payment status
		await tx
			.update(payments)
			.set({
				status: 'cancelled',
				cancelledAt: new Date(cancelInfo.canceledAt),
				refundedAt: new Date(cancelInfo.canceledAt),
				refundAmount: cancelInfo.cancelAmount,
				updatedAt: new Date()
			})
			.where(eq(payments.id, payment.id));

		// Insert refund record
		await tx.insert(paymentRefunds).values({
			paymentId: payment.id,
			refundAmount: cancelInfo.cancelAmount,
			refundType: 'full',
			refundReason: cancelInfo.cancelReason,
			tossTransactionKey: cancelInfo.transactionKey,
			tossResponse: cancelInfo,
			status: 'completed'
		});

		// Revert trip/offer status if needed
		if (payment.tripId && payment.offerId) {
			await tx
				.update(trips)
				.set({
					status: 'submitted',
					statusUpdatedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(trips.id, payment.tripId));

			await tx
				.update(offers)
				.set({
					status: 'pending',
					updatedAt: new Date()
				})
				.where(eq(offers.id, payment.offerId));
		}
	});

	console.log('[Webhook] Payment cancellation processed');
}

// Handle partial payment cancellation
async function handlePaymentPartialCanceled(payment: any, data: any) {
	console.log('[Webhook] Processing PAYMENT.PARTIAL_CANCELED');

	// Get the latest cancel information
	const latestCancel = data.cancels?.slice(-1)[0];
	if (!latestCancel) {
		console.error('[Webhook] No cancel information in payload');
		return;
	}

	// Calculate total refunded amount from all cancels
	const totalRefunded = data.cancels?.reduce((sum, cancel) => sum + cancel.cancelAmount, 0) || 0;

	await db.transaction(async (tx) => {
		// Update payment with new refund amount
		await tx
			.update(payments)
			.set({
				refundedAt: new Date(latestCancel.canceledAt),
				refundAmount: totalRefunded,
				updatedAt: new Date()
			})
			.where(eq(payments.id, payment.id));

		// Check if this refund is already recorded (by transaction key)
		const existingRefund = await tx
			.select()
			.from(paymentRefunds)
			.where(eq(paymentRefunds.tossTransactionKey, latestCancel.transactionKey))
			.limit(1);

		if (existingRefund.length === 0) {
			// Insert new refund record
			await tx.insert(paymentRefunds).values({
				paymentId: payment.id,
				refundAmount: latestCancel.cancelAmount,
				refundType: 'partial',
				refundReason: latestCancel.cancelReason,
				tossTransactionKey: latestCancel.transactionKey,
				tossResponse: latestCancel,
				status: 'completed'
			});
		}
	});

	console.log('[Webhook] Partial refund processed');
}

// Handle payment failure
async function handlePaymentFailed(payment: any, data: any) {
	console.log('[Webhook] Processing PAYMENT.FAILED');

	await db
		.update(payments)
		.set({
			status: 'failed',
			failureReason: data.failure?.message || 'Payment failed',
			updatedAt: new Date()
		})
		.where(eq(payments.id, payment.id));

	console.log('[Webhook] Payment marked as failed');
}

// Handle payment expiration
async function handlePaymentExpired(payment: any, data: any) {
	console.log('[Webhook] Processing PAYMENT.EXPIRED');

	await db
		.update(payments)
		.set({
			status: 'failed',
			failureReason: 'Payment expired',
			updatedAt: new Date()
		})
		.where(eq(payments.id, payment.id));

	console.log('[Webhook] Payment marked as expired');
}

// Verify payment status with Toss API
// This is the recommended security approach instead of webhook signatures
async function verifyPaymentWithTossAPI(
	paymentKey: string,
	expectedStatus: string
): Promise<boolean> {
	try {
		const tossSecretKey = env.TOSS_SECRET_KEY;
		if (!tossSecretKey) {
			console.error('[Webhook] Toss secret key not configured');
			return false;
		}

		const authHeader = Buffer.from(`${tossSecretKey}:`).toString('base64');
		const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
			method: 'GET',
			headers: {
				Authorization: `Basic ${authHeader}`
			}
		});

		if (!response.ok) {
			console.error('[Webhook] Failed to verify payment with Toss API');
			return false;
		}

		const paymentData = await response.json();

		// Map webhook status to API status
		let apiStatus = paymentData.status;
		if (expectedStatus === 'CANCELED' && paymentData.cancels?.length > 0) {
			// Check if fully cancelled
			if (paymentData.balanceAmount === 0) {
				apiStatus = 'CANCELED';
			}
		} else if (expectedStatus === 'PARTIAL_CANCELED' && paymentData.cancels?.length > 0) {
			// Check if partially cancelled
			if (paymentData.balanceAmount > 0 && paymentData.balanceAmount < paymentData.totalAmount) {
				apiStatus = 'PARTIAL_CANCELED';
			}
		}

		const isValid = apiStatus === expectedStatus;
		if (!isValid) {
			console.error('[Webhook] Status mismatch:', { expected: expectedStatus, actual: apiStatus });
		}

		return isValid;
	} catch (err) {
		console.error('[Webhook] Error verifying payment:', err);
		return false;
	}
}

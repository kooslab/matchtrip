import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// Test webhook endpoint for local development
// This endpoint simulates Toss webhook calls for testing

interface TestWebhookRequest {
	eventType: string;
	paymentKey: string;
	orderId?: string;
	cancelAmount?: number;
	cancelReason?: string;
}

export const POST: RequestHandler = async ({ request, fetch }) => {
	// Only allow in development
	if (env.NODE_ENV === 'production') {
		return json({ error: 'Test endpoint not available in production' }, { status: 403 });
	}

	const body: TestWebhookRequest = await request.json();

	// Create a test webhook payload
	const eventId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	const timestamp = new Date().toISOString();

	let payload: any = {
		eventType: body.eventType,
		eventId,
		timestamp,
		data: {
			paymentKey: body.paymentKey,
			orderId: body.orderId || `test_order_${Date.now()}`,
			status: 'DONE',
			requestedAt: timestamp,
			approvedAt: timestamp,
			method: 'CARD',
			totalAmount: 100000,
			balanceAmount: 100000,
			suppliedAmount: 90909,
			vat: 9091
		}
	};

	// Customize payload based on event type
	switch (body.eventType) {
		case 'PAYMENT.DONE':
			payload.data.status = 'DONE';
			break;

		case 'PAYMENT.CANCELED':
			payload.data.status = 'CANCELED';
			payload.data.cancels = [
				{
					transactionKey: `test_txn_${Date.now()}`,
					cancelReason: body.cancelReason || 'Test cancellation',
					canceledAt: timestamp,
					cancelAmount: body.cancelAmount || 100000,
					taxFreeAmount: 0,
					taxExemptionAmount: 0,
					refundableAmount: 0,
					easyPayDiscountAmount: 0,
					cancelStatus: 'DONE',
					cancelRequestId: `test_cancel_${Date.now()}`
				}
			];
			break;

		case 'PAYMENT.PARTIAL_CANCELED':
			payload.data.status = 'PARTIAL_CANCELED';
			payload.data.cancels = [
				{
					transactionKey: `test_txn_${Date.now()}`,
					cancelReason: body.cancelReason || 'Test partial cancellation',
					canceledAt: timestamp,
					cancelAmount: body.cancelAmount || 50000,
					taxFreeAmount: 0,
					taxExemptionAmount: 0,
					refundableAmount: 50000,
					easyPayDiscountAmount: 0,
					cancelStatus: 'DONE',
					cancelRequestId: `test_cancel_${Date.now()}`
				}
			];
			payload.data.balanceAmount = 50000;
			break;

		case 'PAYMENT.FAILED':
			payload.data.status = 'ABORTED';
			payload.data.failure = {
				code: 'TEST_ERROR',
				message: 'Test payment failure'
			};
			break;

		case 'PAYMENT.EXPIRED':
			payload.data.status = 'EXPIRED';
			break;

		default:
			return json({ error: 'Invalid event type' }, { status: 400 });
	}

	// Call the actual webhook endpoint
	const webhookUrl = new URL('/api/webhooks/toss', request.url).toString();
	const webhookResponse = await fetch(webhookUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(payload)
	});

	const result = await webhookResponse.json();

	return json({
		success: webhookResponse.ok,
		testEventId: eventId,
		webhookResponse: result,
		payload: payload
	});
};

// GET endpoint to show test instructions
export const GET: RequestHandler = async () => {
	const instructions = {
		endpoint: '/api/webhooks/test',
		method: 'POST',
		description: 'Test webhook endpoint for local development',
		usage: 'Send a POST request with the following body structure',
		body: {
			eventType:
				'PAYMENT.DONE | PAYMENT.CANCELED | PAYMENT.PARTIAL_CANCELED | PAYMENT.FAILED | PAYMENT.EXPIRED',
			paymentKey: 'payment_key_from_toss',
			orderId: 'optional_order_id',
			cancelAmount: 'optional_amount_for_cancellation',
			cancelReason: 'optional_cancellation_reason'
		},
		examples: [
			{
				description: 'Test payment completion',
				body: {
					eventType: 'PAYMENT.DONE',
					paymentKey: 'test_payment_key_123'
				}
			},
			{
				description: 'Test full cancellation',
				body: {
					eventType: 'PAYMENT.CANCELED',
					paymentKey: 'test_payment_key_123',
					cancelReason: 'Customer request'
				}
			},
			{
				description: 'Test partial refund',
				body: {
					eventType: 'PAYMENT.PARTIAL_CANCELED',
					paymentKey: 'test_payment_key_123',
					cancelAmount: 50000,
					cancelReason: 'Partial refund test'
				}
			}
		],
		note: 'This endpoint is only available in development environment'
	};

	return json(instructions);
};

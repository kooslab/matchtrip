import { db } from '$lib/server/db';
import { payments, cancellationRequests } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

interface RefundParams {
	paymentKey: string;
	cancelReason: string;
	refundAmount: number;
	cancellationRequestId: string;
}

interface TossRefundResponse {
	mId: string;
	version: string;
	paymentKey: string;
	orderId: string;
	orderName: string;
	currency: string;
	method: string;
	status: string;
	requestedAt: string;
	approvedAt: string;
	card?: {
		company: string;
		number: string;
		installmentPlanMonths: number;
		isInterestFree: boolean;
		approveNo: string;
		useCardPoint: boolean;
		cardType: string;
		ownerType: string;
		acquireStatus: string;
		receiptUrl: string;
	};
	virtualAccount?: any;
	transfer?: any;
	mobilePhone?: any;
	giftCertificate?: any;
	cashReceipt?: any;
	discount?: any;
	cancels?: Array<{
		transactionKey: string;
		cancelReason: string;
		taxExemptionAmount: number;
		canceledAt: string;
		easyPayDiscountAmount: number;
		receiptKey: string;
		cancelAmount: number;
		taxFreeAmount: number;
		refundableAmount: number;
		cancelStatus: string;
		cancelRequestId: string;
	}>;
	secret?: string;
	type: string;
	easyPay?: any;
	country: string;
	failure?: any;
	totalAmount: number;
	balanceAmount: number;
	suppliedAmount: number;
	vat: number;
	taxFreeAmount: number;
	taxExemptionAmount: number;
}

export class RefundService {
	private readonly tossApiUrl = 'https://api.tosspayments.com/v1/payments';
	private readonly secretKey = env.TOSS_SECRET_KEY;

	/**
	 * Process refund through Toss Payments API
	 */
	async processRefund(params: RefundParams): Promise<TossRefundResponse> {
		const { paymentKey, cancelReason, refundAmount, cancellationRequestId } = params;

		// Validate payment exists and is eligible for refund
		const [payment] = await db
			.select()
			.from(payments)
			.where(eq(payments.paymentKey, paymentKey))
			.limit(1);

		if (!payment) {
			throw new Error('Payment not found');
		}

		if (payment.status !== 'completed' && payment.status !== 'cancelled') {
			throw new Error('Payment is not eligible for refund');
		}

		// Call Toss Payments API to process refund
		const refundResponse = await this.callTossRefundAPI({
			paymentKey,
			cancelReason,
			cancelAmount: refundAmount,
			taxFreeAmount: 0
		});

		// Update payment record with refund information
		await db
			.update(payments)
			.set({
				status: 'refunded',
				refundedAt: new Date(),
				refundAmount,
				updatedAt: new Date()
			})
			.where(eq(payments.id, payment.id));

		// Update cancellation request to reflect refund completion
		await db
			.update(cancellationRequests)
			.set({
				actualRefundAmount: refundAmount,
				updatedAt: new Date()
			})
			.where(eq(cancellationRequests.id, cancellationRequestId));

		return refundResponse;
	}

	/**
	 * Call Toss Payments refund API
	 */
	private async callTossRefundAPI(params: {
		paymentKey: string;
		cancelReason: string;
		cancelAmount: number;
		taxFreeAmount: number;
	}): Promise<TossRefundResponse> {
		const { paymentKey, cancelReason, cancelAmount, taxFreeAmount } = params;

		if (!this.secretKey) {
			throw new Error('Toss Payments secret key is not configured');
		}

		const url = `${this.tossApiUrl}/${paymentKey}/cancel`;
		const authorization = 'Basic ' + Buffer.from(this.secretKey + ':').toString('base64');

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Authorization': authorization,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					cancelReason,
					cancelAmount,
					taxFreeAmount
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Toss refund API error:', errorData);
				throw new Error(errorData.message || 'Failed to process refund');
			}

			return await response.json();
		} catch (error) {
			console.error('Error calling Toss refund API:', error);
			throw new Error('Failed to process refund through payment gateway');
		}
	}

	/**
	 * Get refund status from Toss Payments
	 */
	async getRefundStatus(paymentKey: string): Promise<TossRefundResponse> {
		if (!this.secretKey) {
			throw new Error('Toss Payments secret key is not configured');
		}

		const url = `${this.tossApiUrl}/${paymentKey}`;
		const authorization = 'Basic ' + Buffer.from(this.secretKey + ':').toString('base64');

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Authorization': authorization
				}
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Failed to get payment status');
			}

			return await response.json();
		} catch (error) {
			console.error('Error getting payment status:', error);
			throw new Error('Failed to get payment status from gateway');
		}
	}

	/**
	 * Calculate refund processing fee (if applicable)
	 */
	calculateRefundFee(originalAmount: number, refundAmount: number): number {
		// Toss Payments typically doesn't charge additional fees for refunds
		// The original transaction fee is usually returned proportionally
		// This method is here for future use if fee calculation is needed
		return 0;
	}

	/**
	 * Validate refund amount
	 */
	validateRefundAmount(originalAmount: number, refundAmount: number): boolean {
		if (refundAmount <= 0) {
			return false;
		}

		if (refundAmount > originalAmount) {
			return false;
		}

		return true;
	}
}
import { db } from '$lib/server/db';
import {
	cancellationRequests,
	payments,
	offers,
	trips,
	productOffers,
	products,
	messages,
	conversations,
	productConversations,
	productMessages,
	type User
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateRefundAmount } from '$lib/utils/refundCalculator';
import { fetchRefundPolicies } from '$lib/server/utils/refundCalculator';
import type {
	TravelerCancellationReason,
	GuideCancellationReason
} from '$lib/constants/cancellation';

interface CreateCancellationRequestParams {
	paymentId: string;
	user: User;
	reasonType: TravelerCancellationReason | GuideCancellationReason;
	reasonDetail?: string;
	supportingDocuments?: string[];
}

interface ProcessCancellationParams {
	requestId: string;
	adminUser: User;
	decision: 'approved' | 'rejected';
	adminNotes?: string;
	overrideRefundAmount?: number;
}

export class CancellationService {
	/**
	 * Create a new cancellation request
	 */
	async createCancellationRequest(params: CreateCancellationRequestParams) {
		const { paymentId, user, reasonType, reasonDetail, supportingDocuments } = params;

		// Get payment details with related trip/product info
		const paymentData = await this.getPaymentWithDetails(paymentId);

		if (!paymentData) {
			throw new Error('Payment not found');
		}

		if (paymentData.payment.status !== 'completed') {
			throw new Error('Only completed payments can be cancelled');
		}

		// Check if there's already a pending cancellation request
		const existingRequest = await db
			.select()
			.from(cancellationRequests)
			.where(
				and(
					eq(cancellationRequests.paymentId, paymentId),
					eq(cancellationRequests.status, 'pending')
				)
			)
			.limit(1);

		if (existingRequest.length > 0) {
			throw new Error('A cancellation request is already pending for this payment');
		}

		// Calculate refund amount
		// Priority: tripStartDate (for trips) > productOfferStartDate (for product offers)
		const tripOrProductDate = paymentData.tripStartDate || paymentData.productOfferStartDate;

		if (!tripOrProductDate) {
			throw new Error('Cannot determine trip/product date for refund calculation');
		}

		// Determine policy type based on what's being cancelled
		const policyType =
			paymentData.payment.productId || paymentData.payment.productOfferId ? 'product' : 'trip';

		// Fetch refund policies from database
		const policies = await fetchRefundPolicies(policyType);

		const refundCalculation = calculateRefundAmount({
			amount: paymentData.payment.amount,
			tripStartDate: tripOrProductDate,
			requesterType: user.role as 'traveler' | 'guide',
			reasonType,
			policyType,
			customPolicies: policies
		});

		// Create cancellation request
		// Only require admin approval if the refund calculation says so
		const requiresApproval = refundCalculation.requiresAdminApproval;

		const [cancellationRequest] = await db
			.insert(cancellationRequests)
			.values({
				paymentId,
				requesterId: user.id,
				requesterType: user.role as 'traveler' | 'guide',
				reasonType,
				reasonDetail,
				supportingDocuments,
				calculatedRefundAmount: refundCalculation.refundAmount,
				status: requiresApproval ? 'pending' : 'approved'
			})
			.returning();

		// Create a message in the conversation
		await this.createCancellationMessage({
			paymentData,
			user,
			cancellationRequest,
			reasonType,
			reasonDetail
		});

		// If auto-approved (guide cancellation always, or traveler with no admin approval needed), process immediately
		if (!requiresApproval) {
			await this.processCancellationApproval(cancellationRequest.id);
		}

		return {
			cancellationRequest,
			refundCalculation
		};
	}

	/**
	 * Process cancellation approval/rejection by admin
	 */
	async processCancellation(params: ProcessCancellationParams) {
		const { requestId, adminUser, decision, adminNotes, overrideRefundAmount } = params;

		// Get cancellation request
		const [request] = await db
			.select()
			.from(cancellationRequests)
			.where(eq(cancellationRequests.id, requestId))
			.limit(1);

		if (!request) {
			throw new Error('Cancellation request not found');
		}

		if (request.status !== 'pending') {
			throw new Error('This cancellation request has already been processed');
		}

		// Update cancellation request
		await db
			.update(cancellationRequests)
			.set({
				status: decision,
				adminNotes,
				processedBy: adminUser.id,
				processedAt: new Date(),
				actualRefundAmount: overrideRefundAmount || request.calculatedRefundAmount,
				updatedAt: new Date()
			})
			.where(eq(cancellationRequests.id, requestId));

		// If approved, process the cancellation
		if (decision === 'approved') {
			await this.processCancellationApproval(requestId);
		} else {
			// Create rejection message in conversation
			await this.createRejectionMessage(request);
		}

		return { success: true };
	}

	/**
	 * Process approved cancellation
	 */
	private async processCancellationApproval(requestId: string) {
		const [request] = await db
			.select()
			.from(cancellationRequests)
			.where(eq(cancellationRequests.id, requestId))
			.limit(1);

		if (!request) {
			throw new Error('Cancellation request not found');
		}

		const paymentData = await this.getPaymentWithDetails(request.paymentId);

		if (!paymentData) {
			throw new Error('Payment not found');
		}

		// Update payment status
		await db
			.update(payments)
			.set({
				status: 'cancelled',
				cancelledAt: new Date(),
				refundAmount: request.actualRefundAmount || request.calculatedRefundAmount,
				cancellationRequestId: requestId,
				updatedAt: new Date()
			})
			.where(eq(payments.id, request.paymentId));

		// Update offer/product offer status
		if (paymentData.payment.offerId) {
			await db
				.update(offers)
				.set({
					status: 'withdrawn',
					updatedAt: new Date()
				})
				.where(eq(offers.id, paymentData.payment.offerId));

			// Update trip status back to submitted
			if (paymentData.payment.tripId) {
				await db
					.update(trips)
					.set({
						status: 'submitted',
						updatedAt: new Date()
					})
					.where(eq(trips.id, paymentData.payment.tripId));
			}
		}

		if (paymentData.payment.productOfferId) {
			await db
				.update(productOffers)
				.set({
					status: 'rejected',
					updatedAt: new Date()
				})
				.where(eq(productOffers.id, paymentData.payment.productOfferId));
		}

		// Create approval message in conversation
		await this.createApprovalMessage(request);
	}

	/**
	 * Get payment with all related details
	 */
	private async getPaymentWithDetails(paymentId: string) {
		const result = await db
			.select({
				payment: payments,
				tripStartDate: trips.startDate,
				productOfferStartDate: productOffers.startDate
			})
			.from(payments)
			.leftJoin(trips, eq(payments.tripId, trips.id))
			.leftJoin(productOffers, eq(payments.productOfferId, productOffers.id))
			.where(eq(payments.id, paymentId))
			.limit(1);

		return result[0] || null;
	}

	/**
	 * Create cancellation message in conversation
	 */
	private async createCancellationMessage(params: any) {
		const { paymentData, user, cancellationRequest, reasonType, reasonDetail } = params;

		// Find the appropriate conversation
		let conversationId: string | null = null;

		if (paymentData.payment.offerId) {
			const [conv] = await db
				.select()
				.from(conversations)
				.where(eq(conversations.offerId, paymentData.payment.offerId))
				.limit(1);
			conversationId = conv?.id || null;
		} else if (paymentData.payment.productOfferId) {
			// For product offers, we need to find the conversation through the product offer
			const [productOffer] = await db
				.select()
				.from(productOffers)
				.where(eq(productOffers.id, paymentData.payment.productOfferId))
				.limit(1);

			if (productOffer) {
				const [conv] = await db
					.select()
					.from(productConversations)
					.where(eq(productConversations.id, productOffer.conversationId))
					.limit(1);
				conversationId = conv?.id || null;
			}
		}

		if (!conversationId) {
			console.error('No conversation found for cancellation message');
			return;
		}

		const messageContent = `취소 요청\n사유: ${reasonType}\n${reasonDetail ? `상세: ${reasonDetail}` : ''}`;

		// Insert message into appropriate table
		if (paymentData.payment.offerId) {
			await db.insert(messages).values({
				conversationId,
				senderId: user.id,
				content: messageContent,
				messageType: 'cancellation_request',
				metadata: {
					cancellationRequestId: cancellationRequest.id,
					reasonType,
					reasonDetail,
					status: cancellationRequest.status
				}
			});
		} else {
			await db.insert(productMessages).values({
				conversationId,
				senderId: user.id,
				content: messageContent,
				messageType: 'cancellation_request',
				metadata: {
					cancellationRequestId: cancellationRequest.id,
					reasonType,
					reasonDetail,
					status: cancellationRequest.status
				}
			});
		}
	}

	/**
	 * Create approval message in conversation
	 */
	private async createApprovalMessage(request: any) {
		// Implementation for creating approval message
		// Similar to createCancellationMessage but with approval content
	}

	/**
	 * Create rejection message in conversation
	 */
	private async createRejectionMessage(request: any) {
		// Implementation for creating rejection message
		// Similar to createCancellationMessage but with rejection content
	}

	/**
	 * Get all pending cancellation requests for admin
	 */
	async getPendingCancellationRequests() {
		return await db
			.select({
				request: cancellationRequests,
				payment: payments,
				trip: trips,
				product: products
			})
			.from(cancellationRequests)
			.innerJoin(payments, eq(cancellationRequests.paymentId, payments.id))
			.leftJoin(trips, eq(payments.tripId, trips.id))
			.leftJoin(products, eq(payments.productId, products.id))
			.where(eq(cancellationRequests.status, 'pending'))
			.orderBy(cancellationRequests.createdAt);
	}
}

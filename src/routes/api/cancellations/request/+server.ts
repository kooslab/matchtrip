import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CancellationService } from '$lib/server/services/cancellation';
import { RefundService } from '$lib/server/services/refund';
import { notificationService } from '$lib/server/services/notificationService';
import { decrypt } from '$lib/server/encryption';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		const session = locals.session;

		if (!session || !user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const body = await request.json();
		const { paymentId, reasonType, reasonDetail, supportingDocuments } = body;

		if (!paymentId || !reasonType) {
			return json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		const cancellationService = new CancellationService();

		// Create cancellation request
		const result = await cancellationService.createCancellationRequest({
			paymentId,
			user,
			reasonType,
			reasonDetail,
			supportingDocuments
		});

		// Send AlimTalk notifications for cancellation request
		try {
			// Get payment and related user details for notifications
			const paymentDetails = await getPaymentDetailsWithUsers(paymentId);

			if (paymentDetails) {
				const { payment, customerName, customerPhone, guideName, guidePhone } = paymentDetails;

				if (user.role === 'traveler') {
					// Customer requested cancellation
					// Send testcode13 to customer (confirmation)
					if (customerPhone) {
						console.log('[CANCELLATION] Sending cancellation request confirmation to customer');
						await notificationService.sendNotification({
							userId: user.id,
							phoneNumber: customerPhone,
							templateCode: 'testcode13',
							templateData: {
								SHOPNAME: '매치트립',
								고객: customerName || '고객',
								주문내역: 'settlement'
							}
						});
					}

					// Send testcode14 to guide (notification)
					if (guidePhone) {
						console.log('[CANCELLATION] Sending cancellation request notification to guide');
						await notificationService.sendNotification({
							phoneNumber: guidePhone,
							templateCode: 'testcode14',
							templateData: {
								SHOPNAME: '매치트립',
								고객: customerName || '고객',
								나의제안: 'my-offers'
							}
						});
					}
				} else if (user.role === 'guide') {
					// Guide requested cancellation
					// Send testcode15 to guide (confirmation)
					if (guidePhone) {
						console.log('[CANCELLATION] Sending cancellation request confirmation to guide');
						await notificationService.sendNotification({
							userId: user.id,
							phoneNumber: guidePhone,
							templateCode: 'testcode15',
							templateData: {
								SHOPNAME: '매치트립',
								가이드님: guideName || '가이드',
								나의제안: 'my-offers'
							}
						});
					}

					// Send testcode16 to customer (notification)
					if (customerPhone) {
						console.log('[CANCELLATION] Sending cancellation request notification to customer');
						await notificationService.sendNotification({
							phoneNumber: customerPhone,
							templateCode: 'testcode16',
							templateData: {
								SHOPNAME: '매치트립',
								가이드: guideName || '가이드',
								주문내역: 'settlement'
							}
						});
					}
				}
			}
		} catch (notificationError) {
			console.error('Failed to send cancellation notifications:', notificationError);
			// Continue even if notifications fail
		}

		// If auto-approved (cancellation within policy that doesn't need admin approval), process refund immediately
		if (result.cancellationRequest.status === 'approved') {
			try {
				const refundService = new RefundService();

				// Get payment details for refund processing
				const { payment } = await getPaymentDetails(paymentId);

				if (payment && payment.paymentKey) {
					const cancelReasonPrefix = user.role === 'guide' ? '가이드 취소' : '고객 취소';
					await refundService.processRefund({
						paymentKey: payment.paymentKey,
						cancelReason: `${cancelReasonPrefix}: ${reasonType}`,
						refundAmount: result.refundCalculation.refundAmount,
						cancellationRequestId: result.cancellationRequest.id
					});
					
					console.log(`[CANCELLATION] Auto-refund processed for ${user.role} cancellation. Amount: ${result.refundCalculation.refundAmount}`);
				}
			} catch (refundError) {
				console.error(`Auto-refund failed for ${user.role} cancellation:`, refundError);
				// Continue even if refund fails - admin can process manually
			}
		}

		return json({
			success: true,
			cancellationRequest: result.cancellationRequest,
			refundCalculation: result.refundCalculation
		});
	} catch (error) {
		console.error('Error creating cancellation request:', error);

		if (error instanceof Error) {
			return json({ success: false, error: error.message }, { status: 400 });
		}

		return json({ success: false, error: '취소 요청 중 오류가 발생했습니다.' }, { status: 500 });
	}
};

// Helper function to get payment details
async function getPaymentDetails(paymentId: string) {
	const { db } = await import('$lib/server/db');
	const { payments } = await import('$lib/server/db/schema');
	const { eq } = await import('drizzle-orm');

	const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);

	return { payment };
}

// Helper function to get payment details with user information for notifications
async function getPaymentDetailsWithUsers(paymentId: string) {
	const { db } = await import('$lib/server/db');
	const { payments, offers, trips, users, travelerProfiles, guideProfiles } = await import(
		'$lib/server/db/schema'
	);
	const { eq } = await import('drizzle-orm');

	// Get payment with offer details
	const [paymentData] = await db
		.select({
			payment: payments,
			offerId: payments.offerId,
			userId: payments.userId
		})
		.from(payments)
		.where(eq(payments.id, paymentId))
		.limit(1);

	if (!paymentData) return null;

	// Get customer (traveler) details
	const [customer] = await db
		.select({
			name: users.name,
			phone: users.phone
		})
		.from(users)
		.where(eq(users.id, paymentData.userId))
		.limit(1);

	// Get guide details if there's an offer
	let guideName = null;
	let guidePhone = null;

	if (paymentData.offerId) {
		const [offerData] = await db
			.select({
				guideId: offers.guideId
			})
			.from(offers)
			.where(eq(offers.id, paymentData.offerId))
			.limit(1);

		if (offerData) {
			const [guide] = await db
				.select({
					name: users.name,
					phone: users.phone
				})
				.from(users)
				.where(eq(users.id, offerData.guideId))
				.limit(1);

			if (guide) {
				guideName = guide.name;
				guidePhone = guide.phone;
			}
		}
	}

	// Decrypt personal data before returning
	const decryptedCustomerName = customer?.name ? decrypt(customer.name) : null;
	const decryptedCustomerPhone = customer?.phone ? decrypt(customer.phone) : null;
	const decryptedGuideName = guideName ? decrypt(guideName) : null;
	const decryptedGuidePhone = guidePhone ? decrypt(guidePhone) : null;

	return {
		payment: paymentData.payment,
		customerName: decryptedCustomerName,
		customerPhone: decryptedCustomerPhone,
		guideName: decryptedGuideName,
		guidePhone: decryptedGuidePhone
	};
}

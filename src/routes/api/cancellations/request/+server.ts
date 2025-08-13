import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CancellationService } from '$lib/server/services/cancellation';
import { RefundService } from '$lib/server/services/refund';

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

		// If auto-approved (guide cancellation without admin approval needed), process refund immediately
		if (result.cancellationRequest.status === 'approved' && user.role === 'guide') {
			try {
				const refundService = new RefundService();
				
				// Get payment details for refund processing
				const { payment } = await getPaymentDetails(paymentId);
				
				if (payment && payment.paymentKey) {
					await refundService.processRefund({
						paymentKey: payment.paymentKey,
						cancelReason: `가이드 취소: ${reasonType}`,
						refundAmount: result.refundCalculation.refundAmount,
						cancellationRequestId: result.cancellationRequest.id
					});
				}
			} catch (refundError) {
				console.error('Auto-refund failed for guide cancellation:', refundError);
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
	
	const [payment] = await db
		.select()
		.from(payments)
		.where(eq(payments.id, paymentId))
		.limit(1);
	
	return { payment };
}
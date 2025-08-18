import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CancellationService } from '$lib/server/services/cancellation';
import { RefundService } from '$lib/server/services/refund';
import { db } from '$lib/server/db';
import { cancellationRequests, payments, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		const session = locals.session;

		if (!session || !user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		// Check if user is admin
		if (user.role !== 'admin') {
			return json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
		}

		const { id: requestId } = params;
		const body = await request.json();
		const { adminNotes, overrideRefundAmount } = body;

		// Get cancellation request details
		const [cancellationRequest] = await db
			.select({
				request: cancellationRequests,
				payment: payments
			})
			.from(cancellationRequests)
			.innerJoin(payments, eq(cancellationRequests.paymentId, payments.id))
			.where(eq(cancellationRequests.id, requestId))
			.limit(1);

		if (!cancellationRequest) {
			return json({ success: false, error: '취소 요청을 찾을 수 없습니다.' }, { status: 404 });
		}

		if (cancellationRequest.request.status !== 'pending') {
			return json({ success: false, error: '이미 처리된 요청입니다.' }, { status: 400 });
		}

		const cancellationService = new CancellationService();

		// Process approval
		await cancellationService.processCancellation({
			requestId,
			adminUser: user,
			decision: 'approved',
			adminNotes,
			overrideRefundAmount
		});

		// Process refund through payment gateway
		const refundAmount = overrideRefundAmount || cancellationRequest.request.calculatedRefundAmount;

		if (cancellationRequest.payment.paymentKey) {
			try {
				const refundService = new RefundService();
				await refundService.processRefund({
					paymentKey: cancellationRequest.payment.paymentKey,
					cancelReason: `관리자 승인: ${cancellationRequest.request.reasonType}`,
					refundAmount,
					cancellationRequestId: requestId
				});
			} catch (refundError) {
				console.error('Refund processing failed:', refundError);
				// Continue even if automatic refund fails - admin can process manually
			}
		}

		return json({
			success: true,
			message: '취소 요청이 승인되었습니다.',
			refundAmount
		});
	} catch (error) {
		console.error('Error approving cancellation:', error);

		if (error instanceof Error) {
			return json({ success: false, error: error.message }, { status: 400 });
		}

		return json({ success: false, error: '승인 처리 중 오류가 발생했습니다.' }, { status: 500 });
	}
};

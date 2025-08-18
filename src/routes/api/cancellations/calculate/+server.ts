import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { calculateRefundAmount, getRefundPolicyDescription } from '$lib/utils/refundCalculator';
import { db } from '$lib/server/db';
import { payments, trips, products } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const user = locals.user;
		const session = locals.session;

		if (!session || !user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const body = await request.json();
		const { paymentId, reasonType } = body;

		if (!paymentId) {
			return json({ success: false, error: '결제 ID가 필요합니다.' }, { status: 400 });
		}

		// Get payment details with trip/product date
		const paymentData = await db
			.select({
				payment: payments,
				tripStartDate: trips.startDate,
				productDate: products.date
			})
			.from(payments)
			.leftJoin(trips, eq(payments.tripId, trips.id))
			.leftJoin(products, eq(payments.productId, products.id))
			.where(eq(payments.id, paymentId))
			.limit(1);

		if (paymentData.length === 0) {
			return json({ success: false, error: '결제 정보를 찾을 수 없습니다.' }, { status: 404 });
		}

		const { payment, tripStartDate, productDate } = paymentData[0];
		const eventDate = tripStartDate || productDate;

		if (!eventDate) {
			return json(
				{ success: false, error: '여행/상품 날짜를 확인할 수 없습니다.' },
				{ status: 400 }
			);
		}

		// Calculate refund amount
		const refundCalculation = calculateRefundAmount({
			amount: payment.amount,
			tripStartDate: eventDate,
			requesterType: user.role as 'traveler' | 'guide',
			reasonType
		});

		// Get refund policy description
		const policyDescription = getRefundPolicyDescription();

		return json({
			success: true,
			calculation: refundCalculation,
			policyDescription,
			payment: {
				id: payment.id,
				amount: payment.amount,
				status: payment.status,
				createdAt: payment.createdAt
			}
		});
	} catch (error) {
		console.error('Error calculating refund:', error);
		return json({ success: false, error: '환불 계산 중 오류가 발생했습니다.' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const user = locals.user;
		const session = locals.session;

		if (!session || !user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		// Return refund policy information
		const policyDescription = getRefundPolicyDescription();

		return json({
			success: true,
			policyDescription
		});
	} catch (error) {
		console.error('Error getting refund policy:', error);
		return json(
			{ success: false, error: '정책 정보를 가져오는 중 오류가 발생했습니다.' },
			{ status: 500 }
		);
	}
};

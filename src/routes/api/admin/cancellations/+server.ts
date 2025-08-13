import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { cancellationRequests, payments, users, trips, products, offers, productOffers } from '$lib/server/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
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

		// Get query parameters for filtering
		const status = url.searchParams.get('status') || 'all';
		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const offset = (page - 1) * limit;

		// Build filter conditions
		let statusCondition;
		if (status === 'pending') {
			statusCondition = eq(cancellationRequests.status, 'pending');
		} else if (status === 'approved') {
			statusCondition = eq(cancellationRequests.status, 'approved');
		} else if (status === 'rejected') {
			statusCondition = eq(cancellationRequests.status, 'rejected');
		} else {
			// All statuses
			statusCondition = or(
				eq(cancellationRequests.status, 'pending'),
				eq(cancellationRequests.status, 'approved'),
				eq(cancellationRequests.status, 'rejected')
			);
		}

		// Get cancellation requests with related data
		const requests = await db
			.select({
				request: cancellationRequests,
				payment: payments,
				requester: users,
				trip: trips,
				product: products,
				offer: offers,
				productOffer: productOffers
			})
			.from(cancellationRequests)
			.innerJoin(payments, eq(cancellationRequests.paymentId, payments.id))
			.innerJoin(users, eq(cancellationRequests.requesterId, users.id))
			.leftJoin(trips, eq(payments.tripId, trips.id))
			.leftJoin(products, eq(payments.productId, products.id))
			.leftJoin(offers, eq(payments.offerId, offers.id))
			.leftJoin(productOffers, eq(payments.productOfferId, productOffers.id))
			.where(statusCondition)
			.orderBy(desc(cancellationRequests.createdAt))
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const [{ count }] = await db
			.select({ count: cancellationRequests.id })
			.from(cancellationRequests)
			.where(statusCondition);

		// Format the response
		const formattedRequests = requests.map(r => ({
			id: r.request.id,
			status: r.request.status,
			reasonType: r.request.reasonType,
			reasonDetail: r.request.reasonDetail,
			supportingDocuments: r.request.supportingDocuments,
			calculatedRefundAmount: r.request.calculatedRefundAmount,
			actualRefundAmount: r.request.actualRefundAmount,
			adminNotes: r.request.adminNotes,
			createdAt: r.request.createdAt,
			processedAt: r.request.processedAt,
			requester: {
				id: r.requester.id,
				name: r.requester.name,
				email: r.requester.email,
				role: r.requester.role
			},
			payment: {
				id: r.payment.id,
				amount: r.payment.amount,
				status: r.payment.status,
				paymentKey: r.payment.paymentKey,
				orderId: r.payment.orderId,
				createdAt: r.payment.createdAt
			},
			tripOrProduct: r.trip ? {
				type: 'trip',
				id: r.trip.id,
				destination: r.trip.destinationId,
				startDate: r.trip.startDate,
				endDate: r.trip.endDate
			} : r.product ? {
				type: 'product',
				id: r.product.id,
				title: r.product.title,
				date: r.product.date
			} : null
		}));

		return json({
			success: true,
			requests: formattedRequests,
			pagination: {
				page,
				limit,
				total: count,
				totalPages: Math.ceil(count / limit)
			}
		});
	} catch (error) {
		console.error('Error fetching cancellation requests:', error);
		return json({ success: false, error: '취소 요청 목록을 가져오는 중 오류가 발생했습니다.' }, { status: 500 });
	}
};
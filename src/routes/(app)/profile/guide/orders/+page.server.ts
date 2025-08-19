import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	offers,
	trips,
	payments,
	users,
	products,
	productOffers,
	reviews
} from '$lib/server/db/schema';
import { eq, and, desc, sql, or } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { decryptUserFields } from '$lib/server/encryption';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		throw redirect(302, '/');
	}

	if (user.role !== 'guide') {
		throw redirect(302, '/');
	}

	// Get all trip orders (accepted offers) for this guide with payment information
	const tripOrders = await db
		.select({
			id: offers.id,
			type: sql<string>`'trip'`,
			title: offers.title,
			price: offers.price,
			status: offers.status,
			createdAt: offers.createdAt,
			updatedAt: offers.updatedAt,
			tripId: trips.id,
			tripStartDate: trips.startDate,
			tripEndDate: trips.endDate,
			adultsCount: trips.adultsCount,
			childrenCount: trips.childrenCount,
			paymentId: payments.id,
			paymentStatus: payments.status,
			paymentAmount: payments.amount,
			paymentCreatedAt: payments.createdAt,
			paymentMethod: payments.paymentMethod,
			buyerId: users.id,
			buyerName: users.name,
			buyerEmail: users.email,
			hasReview: sql<boolean>`CASE WHEN ${reviews.id} IS NOT NULL AND ${reviews.rating} > 0 THEN true ELSE false END`,
			reviewRequestedAt: reviews.reviewRequestedAt
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.leftJoin(payments, eq(payments.offerId, offers.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.leftJoin(reviews, and(eq(reviews.offerId, offers.id), eq(reviews.travelerId, users.id)))
		.where(and(eq(offers.guideId, user.id), eq(offers.status, 'accepted')))
		.orderBy(desc(offers.updatedAt));

	// Get all product orders for this guide with payment information
	const productOrders = await db
		.select({
			id: payments.id,
			type: sql<string>`'product'`,
			title: products.title,
			price: products.price,
			status: sql<string>`'completed'`,
			createdAt: payments.createdAt,
			updatedAt: payments.updatedAt,
			productId: products.id,
			productOfferPrice: productOffers.price,
			productOfferDuration: productOffers.duration,
			paymentId: payments.id,
			paymentStatus: payments.status,
			paymentAmount: payments.amount,
			paymentCreatedAt: payments.createdAt,
			paymentMethod: payments.paymentMethod,
			buyerId: users.id,
			buyerName: users.name,
			buyerEmail: users.email,
			hasReview: sql<boolean>`CASE WHEN ${reviews.id} IS NOT NULL AND ${reviews.rating} > 0 THEN true ELSE false END`,
			reviewRequestedAt: reviews.reviewRequestedAt
		})
		.from(payments)
		.innerJoin(products, eq(payments.productId, products.id))
		.leftJoin(productOffers, eq(payments.productOfferId, productOffers.id))
		.leftJoin(users, eq(payments.userId, users.id))
		.leftJoin(reviews, and(eq(reviews.productId, products.id), eq(reviews.travelerId, users.id)))
		.where(eq(products.guideId, user.id))
		.orderBy(desc(payments.createdAt));

	// Combine and sort all orders by date
	const allOrders = [...tripOrders, ...productOrders].sort((a, b) => {
		const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
		const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
		return dateB - dateA;
	});

	// Decrypt buyer information for all orders
	const decryptedOrders = allOrders.map(order => {
		if (order.buyerName || order.buyerEmail) {
			const decryptedBuyer = decryptUserFields({
				name: order.buyerName,
				email: order.buyerEmail
			});
			return {
				...order,
				buyerName: decryptedBuyer.name,
				buyerEmail: decryptedBuyer.email
			};
		}
		return order;
	});

	return {
		orders: decryptedOrders
	};
};

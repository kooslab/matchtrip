import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { payments, offers, trips, users, guideProfiles, destinations } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	// Fetch all payments with related data
	const allPayments = await db
		.select({
			id: payments.id,
			paymentKey: payments.paymentKey,
			amount: payments.amount,
			status: payments.status,
			createdAt: payments.createdAt,
			updatedAt: payments.updatedAt,
			// Offer info
			offerId: offers.id,
			offerPrice: offers.price,
			offerStatus: offers.status,
			// Trip info
			tripId: trips.id,
			tripDestination: destinations.city,
			tripStartDate: trips.startDate,
			tripEndDate: trips.endDate,
			// Traveler info
			travelerName: sql<string>`traveler.name`.as('travelerName'),
			travelerEmail: sql<string>`traveler.email`.as('travelerEmail'),
			// Guide info
			guideName: sql<string>`guide_user.name`.as('guideName'),
			guideEmail: sql<string>`guide_user.email`.as('guideEmail'),
			guideVerified: sql<boolean>`COALESCE(${guideProfiles.isVerified}, false)`.as('guideVerified')
		})
		.from(payments)
		.leftJoin(offers, eq(payments.offerId, offers.id))
		.leftJoin(trips, eq(offers.tripId, trips.id))
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(users.as('traveler'), eq(trips.userId, sql`traveler.id`))
		.leftJoin(guideProfiles, eq(offers.guideId, guideProfiles.userId))
		.leftJoin(users.as('guide_user'), eq(offers.guideId, sql`guide_user.id`))
		.orderBy(desc(payments.createdAt));

	// Calculate statistics
	const stats = {
		total: allPayments.length,
		pending: allPayments.filter(p => p.status === 'pending').length,
		succeeded: allPayments.filter(p => p.status === 'succeeded').length,
		failed: allPayments.filter(p => p.status === 'failed').length,
		refunded: allPayments.filter(p => p.status === 'refunded').length,
		totalRevenue: allPayments
			.filter(p => p.status === 'succeeded')
			.reduce((sum, p) => sum + (p.amount || 0), 0),
		pendingAmount: allPayments
			.filter(p => p.status === 'pending')
			.reduce((sum, p) => sum + (p.amount || 0), 0),
		refundedAmount: allPayments
			.filter(p => p.status === 'refunded')
			.reduce((sum, p) => sum + (p.amount || 0), 0)
	};

	// Monthly revenue calculation for the last 6 months
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

	const monthlyRevenue = await db
		.select({
			month: sql<string>`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`.as('month'),
			revenue: sql<number>`SUM(${payments.amount})`.as('revenue')
		})
		.from(payments)
		.where(
			sql`${payments.status} = 'succeeded' AND ${payments.createdAt} >= ${sixMonthsAgo}`
		)
		.groupBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`)
		.orderBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`);

	return {
		payments: allPayments,
		stats,
		monthlyRevenue
	};
};
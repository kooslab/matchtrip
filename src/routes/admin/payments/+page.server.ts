import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { payments, offers, trips, users, guideProfiles, destinations } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('[ADMIN PAYMENTS] Starting load function');
	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	try {
		console.log('[ADMIN PAYMENTS] About to fetch payments');
		// Fetch all payments with related data using subqueries instead of aliases
		const allPayments = await db
			.select({
				id: payments.id,
				amount: payments.amount,
				currency: payments.currency,
				status: payments.status,
				paymentKey: payments.paymentKey,
				orderId: payments.orderId,
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
				// Traveler info via subquery
				travelerName: sql<string>`(SELECT name FROM ${users} WHERE ${users.id} = ${trips.userId})`,
				travelerEmail: sql<string>`(SELECT email FROM ${users} WHERE ${users.id} = ${trips.userId})`,
				// Guide info via subquery
				guideName: sql<string>`(SELECT name FROM ${users} WHERE ${users.id} = ${offers.guideId})`,
				guideEmail: sql<string>`(SELECT email FROM ${users} WHERE ${users.id} = ${offers.guideId})`,
				guideVerified: sql<boolean>`COALESCE((SELECT is_verified FROM ${guideProfiles} WHERE ${guideProfiles.userId} = ${offers.guideId}), false)`
			})
			.from(payments)
			.leftJoin(offers, eq(payments.offerId, offers.id))
			.leftJoin(trips, eq(offers.tripId, trips.id))
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.orderBy(desc(payments.createdAt));

		console.log('[ADMIN PAYMENTS] Fetched payments:', allPayments.length);

		// Calculate statistics
		const stats = {
			total: allPayments.length,
			pending: allPayments.filter((p) => p.status === 'pending').length,
			processing: allPayments.filter((p) => p.status === 'processing').length,
			completed: allPayments.filter((p) => p.status === 'completed').length,
			failed: allPayments.filter((p) => p.status === 'failed').length,
			cancelled: allPayments.filter((p) => p.status === 'cancelled').length,
			refunded: allPayments.filter((p) => p.status === 'refunded').length,
			totalRevenue: allPayments
				.filter((p) => p.status === 'completed')
				.reduce((sum, p) => sum + (p.amount || 0), 0)
		};

		// Monthly revenue calculation for the last 6 months
		console.log('[ADMIN PAYMENTS] Calculating monthly revenue');
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

		const monthlyRevenue = await db
			.select({
				month: sql<string>`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`,
				revenue: sql<number>`SUM(${payments.amount})`
			})
			.from(payments)
			.where(sql`${payments.status} = 'completed' AND ${payments.createdAt} >= ${sixMonthsAgo}`)
			.groupBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`)
			.orderBy(sql`TO_CHAR(${payments.createdAt}, 'YYYY-MM')`);

		console.log('[ADMIN PAYMENTS] Done loading');
		return {
			payments: allPayments,
			stats,
			monthlyRevenue
		};
	} catch (error) {
		console.error('[ADMIN PAYMENTS] Error:', error);
		throw error;
	}
};

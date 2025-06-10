import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { offers, users, trips, guides } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	// Fetch all offers with related data
	const allOffers = await db
		.select({
			id: offers.id,
			price: offers.price,
			message: offers.message,
			status: offers.status,
			createdAt: offers.createdAt,
			updatedAt: offers.updatedAt,
			// Trip info
			tripId: trips.id,
			tripDestination: trips.destination,
			tripStartDate: trips.startDate,
			tripEndDate: trips.endDate,
			tripStatus: trips.status,
			tripPeople: trips.people,
			// Traveler info
			travelerName: sql<string>`traveler.name`.as('travelerName'),
			travelerEmail: sql<string>`traveler.email`.as('travelerEmail'),
			// Guide info
			guideName: sql<string>`guide_user.name`.as('guideName'),
			guideEmail: sql<string>`guide_user.email`.as('guideEmail'),
			guideVerified: sql<boolean>`COALESCE(${guides.verified}, false)`.as('guideVerified'),
			// Payment status
			paymentStatus: sql<string>`
				CASE 
					WHEN EXISTS (
						SELECT 1 FROM payments 
						WHERE payments.offer_id = ${offers.id} 
						AND payments.status = 'succeeded'
					) THEN 'paid'
					ELSE 'unpaid'
				END
			`.as('paymentStatus')
		})
		.from(offers)
		.leftJoin(trips, eq(offers.tripId, trips.id))
		.leftJoin(users.as('traveler'), eq(trips.userId, sql`traveler.id`))
		.leftJoin(guides, eq(offers.guideId, guides.id))
		.leftJoin(users.as('guide_user'), eq(guides.userId, sql`guide_user.id`))
		.orderBy(desc(offers.createdAt));

	// Calculate statistics
	const stats = {
		total: allOffers.length,
		pending: allOffers.filter(o => o.status === 'pending').length,
		accepted: allOffers.filter(o => o.status === 'accepted').length,
		rejected: allOffers.filter(o => o.status === 'rejected').length,
		cancelled: allOffers.filter(o => o.status === 'cancelled').length,
		paid: allOffers.filter(o => o.paymentStatus === 'paid').length,
		totalRevenue: allOffers
			.filter(o => o.status === 'accepted' && o.paymentStatus === 'paid')
			.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0)
	};

	return {
		offers: allOffers,
		stats
	};
};
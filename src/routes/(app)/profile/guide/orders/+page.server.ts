import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { offers, trips, payments, users } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		throw redirect(302, '/');
	}

	if (user.role !== 'guide') {
		throw redirect(302, '/');
	}

	// Get all accepted offers for this guide with payment information
	const guideOrders = await db
		.select({
			offer: offers,
			trip: trips,
			payment: payments,
			traveler: users
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.leftJoin(payments, eq(payments.offerId, offers.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.where(
			and(
				eq(offers.guideId, user.id),
				eq(offers.status, 'accepted')
			)
		)
		.orderBy(desc(offers.updatedAt));

	return {
		orders: guideOrders
	};
};
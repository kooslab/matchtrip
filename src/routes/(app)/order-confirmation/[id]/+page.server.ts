import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { payments, offers, trips, users, guideProfiles, destinations } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = locals.session;
	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	const orderId = params.id;

	// Get payment/order information
	// Check if user is either the buyer or the guide for this order
	const paymentData = await db
		.select({
			payment: payments,
			offer: offers,
			trip: trips,
			destination: destinations,
			guide: users,
			guideProfile: guideProfiles
		})
		.from(payments)
		.innerJoin(offers, eq(payments.offerId, offers.id))
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(users, eq(offers.guideId, users.id))
		.leftJoin(guideProfiles, eq(offers.guideId, guideProfiles.userId))
		.where(
			and(
				eq(payments.orderId, orderId),
				or(
					eq(payments.userId, session.user.id), // User is the buyer
					eq(offers.guideId, session.user.id) // User is the guide
				)
			)
		)
		.limit(1);

	if (!paymentData || paymentData.length === 0) {
		throw error(404, 'Order not found');
	}

	const { payment, offer, trip, destination, guide, guideProfile } = paymentData[0];

	return {
		order: payment,
		trip: {
			...trip,
			destination
		},
		offer,
		guide: {
			...guide,
			phone: guide?.phone || null,
			guideProfile
		}
	};
};

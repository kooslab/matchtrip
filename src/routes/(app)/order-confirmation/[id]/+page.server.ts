import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { payments, offers, trips, users, guideProfiles, destinations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.auth.getSession();
	if (!session?.user?.id) {
		throw error(401, 'Unauthorized');
	}

	const orderId = params.id;

	// Get payment/order information
	const payment = await db
		.select()
		.from(payments)
		.where(and(eq(payments.orderId, orderId), eq(payments.userId, session.user.id)))
		.limit(1);

	if (!payment || payment.length === 0) {
		throw error(404, 'Order not found');
	}

	const paymentData = payment[0];

	// Get offer information
	const offerData = await db
		.select({
			offer: offers,
			trip: trips,
			destination: destinations,
			guide: users,
			guideProfile: guideProfiles
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(users, eq(offers.guideId, users.id))
		.leftJoin(guideProfiles, eq(offers.guideId, guideProfiles.userId))
		.where(eq(offers.id, paymentData.offerId))
		.limit(1);

	if (!offerData || offerData.length === 0) {
		throw error(404, 'Offer not found');
	}

	const { offer, trip, destination, guide, guideProfile } = offerData[0];

	return {
		order: paymentData,
		trip: {
			...trip,
			destination
		},
		offer,
		guide: {
			...guide,
			phone: guideProfile?.phoneNumber || null
		}
	};
};
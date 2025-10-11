import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { offers, users, trips, guideProfiles, destinations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, request, locals, url }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;

	// If no session in locals, get it directly
	if (!session) {
		session = await auth.api.getSession({ headers: request.headers });
	}

	// Redirect if not logged in
	if (!session?.user) {
		throw redirect(302, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// Get offer with guide details
	const offer = await db
		.select({
			offer: offers,
			guide: users,
			guideProfile: guideProfiles,
			trip: trips,
			destination: destinations
		})
		.from(offers)
		.leftJoin(users, eq(offers.guideId, users.id))
		.leftJoin(guideProfiles, eq(offers.guideId, guideProfiles.userId))
		.leftJoin(trips, eq(offers.tripId, trips.id))
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.where(eq(offers.id, params.offerId))
		.limit(1);

	if (offer.length === 0) {
		throw error(404, 'Offer not found');
	}

	const offerData = offer[0];

	// Verify that the current user is the trip owner
	if (offerData.trip?.userId !== session.user.id) {
		throw redirect(302, `/unauthorized?path=${encodeURIComponent(url.pathname)}`);
	}

	console.log('offer data', offerData);

	return {
		offer: {
			...offerData.offer,
			guide: offerData.guide,
			guideProfile: offerData.guideProfile
		},
		trip: {
			...offerData.trip,
			destination: offerData.destination
		}
	};
};

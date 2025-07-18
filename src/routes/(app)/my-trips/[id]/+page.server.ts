import { db } from '$lib/server/db';
import {
	trips,
	destinations,
	users,
	offers,
	guideProfiles,
	countries,
	continents,
	reviews
} from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ params, request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;

	console.log('Trip details page - Session from locals:', !!session);

	// If no session in locals, get it directly
	if (!session) {
		console.log('Trip details page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('Trip details page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	const tripId = params.id;

	if (!tripId) {
		throw redirect(302, '/my-trips');
	}

	// Fetch trip details with destination info
	const trip = await db
		.select({
			id: trips.id,
			userId: trips.userId,
			adultsCount: trips.adultsCount,
			childrenCount: trips.childrenCount,
			startDate: trips.startDate,
			endDate: trips.endDate,
			travelMethod: trips.travelMethod,
			customRequest: trips.customRequest,
			status: trips.status,
			createdAt: trips.createdAt,
			budgetMin: trips.budgetMin,
			budgetMax: trips.budgetMax,
			travelStyle: trips.travelStyle,
			activities: trips.activities,
			destination: {
				id: destinations.id,
				city: destinations.city,
				imageUrl: destinations.imageUrl
			},
			country: {
				id: countries.id,
				name: countries.name,
				code: countries.code
			},
			continent: {
				id: continents.id,
				name: continents.name,
				code: continents.code
			}
		})
		.from(trips)
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(countries, eq(destinations.countryId, countries.id))
		.leftJoin(continents, eq(countries.continentId, continents.id))
		.where(and(eq(trips.id, tripId), eq(trips.userId, session.user.id)))
		.limit(1);

	if (trip.length === 0) {
		throw redirect(302, '/my-trips');
	}

	// Fetch offers for this trip with guide information
	const tripOffers = await db
		.select({
			id: offers.id,
			price: offers.price,
			itinerary: offers.itinerary,
			status: offers.status,
			createdAt: offers.createdAt,
			guide: {
				id: users.id,
				name: users.name,
				email: users.email
			},
			guideProfile: {
				profileImageUrl: guideProfiles.profileImageUrl,
				currentLocation: guideProfiles.currentLocation,
				guideAreas: guideProfiles.guideAreas,
				languages: guideProfiles.languages,
				experience: guideProfiles.experience,
				introduction: guideProfiles.introduction
			}
		})
		.from(offers)
		.leftJoin(users, eq(offers.guideId, users.id))
		.leftJoin(guideProfiles, eq(users.id, guideProfiles.userId))
		.where(eq(offers.tripId, tripId))
		.orderBy(offers.createdAt);

	// Fetch review if exists for this trip
	const tripReview = await db
		.select({
			id: reviews.id,
			rating: reviews.rating,
			content: reviews.content,
			reviewToken: reviews.reviewToken,
			reviewRequestedAt: reviews.reviewRequestedAt,
			createdAt: reviews.createdAt
		})
		.from(reviews)
		.where(and(eq(reviews.tripId, tripId), eq(reviews.travelerId, session.user.id)))
		.limit(1);

	return {
		trip: trip[0],
		offers: tripOffers,
		review: tripReview[0] || null
	};
};

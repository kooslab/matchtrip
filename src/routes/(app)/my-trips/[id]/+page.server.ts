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
import { eq, and, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { decryptUserFields } from '$lib/server/encryption';

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
		throw redirect(302, '/login');
	}

	const tripId = params.id;

	if (!tripId) {
		throw redirect(302, '/my-trips');
	}

	// First, check if the trip exists at all (without user filter)
	const tripCheck = await db
		.select({
			id: trips.id,
			userId: trips.userId
		})
		.from(trips)
		.where(eq(trips.id, tripId))
		.limit(1);

	// If trip doesn't exist at all, redirect to my-trips
	if (tripCheck.length === 0) {
		throw redirect(302, '/my-trips');
	}

	// If trip exists but belongs to a different user, show unauthorized
	if (tripCheck[0].userId !== session.user.id) {
		throw redirect(302, `/unauthorized?path=${encodeURIComponent(`/my-trips/${tripId}`)}`);
	}

	// Fetch trip details with destination info (now we know it exists and belongs to this user)
	const trip = await db
		.select({
			id: trips.id,
			userId: trips.userId,
			adultsCount: trips.adultsCount,
			childrenCount: trips.childrenCount,
			babiesCount: trips.babiesCount,
			startDate: trips.startDate,
			endDate: trips.endDate,
			travelMethod: trips.travelMethod,
			customRequest: trips.customRequest,
			additionalRequest: trips.additionalRequest,
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
		.where(eq(trips.id, tripId))
		.limit(1);

	// Fetch offers for this trip with guide information
	const tripOffers = await db
		.select({
			id: offers.id,
			price: offers.price,
			title: offers.title,
			description: offers.description,
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

	// For each offer, fetch the guide's average rating and accepted offers count
	const offersWithStats = await Promise.all(
		tripOffers.map(async (offer) => {
			if (!offer.guide?.id) return offer;

			// Decrypt guide information
			const decryptedGuide = offer.guide ? decryptUserFields(offer.guide) : null;

			// Get average rating
			const avgRatingResult = await db
				.select({
					avgRating: sql`COALESCE(AVG(${reviews.rating}), 0)`.as('avgRating')
				})
				.from(reviews)
				.where(eq(reviews.guideId, offer.guide.id));

			// Get accepted offers count
			const acceptedOffersResult = await db
				.select({
					count: sql`COUNT(*)`.as('count')
				})
				.from(offers)
				.where(and(eq(offers.guideId, offer.guide.id), eq(offers.status, 'accepted')));

			return {
				...offer,
				guide: decryptedGuide,
				guideProfile: {
					...offer.guideProfile,
					avgRating: Number(avgRatingResult[0]?.avgRating || 0),
					acceptedOffersCount: Number(acceptedOffersResult[0]?.count || 0)
				}
			};
		})
	);

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
		offers: offersWithStats,
		review: tripReview[0] || null
	};
};

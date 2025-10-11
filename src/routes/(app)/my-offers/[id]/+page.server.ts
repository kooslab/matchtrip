import { db } from '$lib/server/db';
import {
	trips,
	destinations,
	users,
	offers,
	countries,
	continents,
	reviews,
	payments,
	conversations,
	messages
} from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { decryptUserFields } from '$lib/server/encryption';

export const load = async ({ params, locals, url }) => {
	// Session and user are guaranteed to exist and be valid due to auth guard in hooks.server.ts
	const session = locals.session;
	const user = locals.user;

	console.log('Offer detail page - Session from locals:', !!session, 'User from locals:', !!user);
	console.log('Offer detail page - User role:', user?.role);
	console.log('Offer detail page - Access granted for guide:', user?.email);

	// Check if user is logged in
	if (!session?.user?.id || !user?.id) {
		throw redirect(302, `/login?redirect=${encodeURIComponent(url.pathname)}`);
	}

	// Check if user has guide role
	if (user.role !== 'guide') {
		throw redirect(302, `/unauthorized?path=${encodeURIComponent(url.pathname)}`);
	}

	const offerId = params.id;

	if (!offerId) {
		throw redirect(302, '/my-offers');
	}

	// First, check if the offer exists at all (without guide filter)
	const offerCheck = await db
		.select({
			id: offers.id,
			guideId: offers.guideId
		})
		.from(offers)
		.where(eq(offers.id, offerId))
		.limit(1);

	console.log('[OFFER AUTH] Offer check result:', offerCheck);
	console.log('[OFFER AUTH] Current user ID:', user.id);

	// If offer doesn't exist at all, redirect to my-offers
	if (offerCheck.length === 0) {
		console.log('[OFFER AUTH] Offer not found, redirecting to /my-offers');
		throw redirect(302, '/my-offers');
	}

	console.log('[OFFER AUTH] Offer guide ID:', offerCheck[0].guideId);
	console.log('[OFFER AUTH] Ownership check:', offerCheck[0].guideId !== user.id);

	// If offer exists but belongs to a different guide, show unauthorized
	if (offerCheck[0].guideId !== user.id) {
		console.log('[OFFER AUTH] Unauthorized access detected! Redirecting to /unauthorized');
		throw redirect(302, `/unauthorized?path=${encodeURIComponent(url.pathname)}`);
	}

	console.log('[OFFER AUTH] Access granted, fetching full offer details');

	// Fetch detailed offer information (now we know it exists and belongs to this guide)
	const offerDetails = await db
		.select({
			// Offer info
			id: offers.id,
			tripId: offers.tripId,
			price: offers.price,
			title: offers.title,
			description: offers.description,
			itinerary: offers.itinerary,
			currency: offers.currency,
			duration: offers.duration,
			maxParticipants: offers.maxParticipants,
			status: offers.status,
			validUntil: offers.validUntil,
			createdAt: offers.createdAt,
			updatedAt: offers.updatedAt,
			// Trip info
			trip: {
				id: trips.id,
				userId: trips.userId,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				startDate: trips.startDate,
				endDate: trips.endDate,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status,
				createdAt: trips.createdAt
			},
			// Destination info
			destination: {
				id: destinations.id,
				city: destinations.city,
				imageUrl: destinations.imageUrl
			},
			// Country info
			country: {
				id: countries.id,
				name: countries.name,
				code: countries.code
			},
			// Continent info
			continent: {
				id: continents.id,
				name: continents.name,
				code: continents.code
			},
			// Traveler info
			traveler: {
				id: users.id,
				name: users.name,
				email: users.email
			}
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(countries, eq(destinations.countryId, countries.id))
		.innerJoin(continents, eq(countries.continentId, continents.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.where(eq(offers.id, offerId))
		.limit(1);

	// Check if review request exists for this offer
	const reviewData = await db
		.select({
			id: reviews.id,
			reviewRequestedAt: reviews.reviewRequestedAt,
			content: reviews.content,
			rating: reviews.rating
		})
		.from(reviews)
		.where(and(eq(reviews.offerId, offerId), eq(reviews.guideId, user.id)))
		.limit(1);

	// Check if payment is completed
	const paymentData = await db
		.select({ count: sql<number>`count(*)` })
		.from(payments)
		.where(and(eq(payments.offerId, offerId), eq(payments.status, 'completed')));

	const hasCompletedPayment = paymentData[0]?.count > 0;

	// Check if conversation exists and if traveler has sent messages
	const conversationData = await db
		.select({
			id: conversations.id,
			travelerId: conversations.travelerId
		})
		.from(conversations)
		.where(eq(conversations.offerId, offerId))
		.limit(1);

	let hasTravelerMessages = false;
	if (conversationData.length > 0) {
		const travelerMessageCount = await db
			.select({ count: sql<number>`count(*)` })
			.from(messages)
			.where(
				and(
					eq(messages.conversationId, conversationData[0].id),
					eq(messages.senderId, conversationData[0].travelerId)
				)
			);
		hasTravelerMessages = travelerMessageCount[0]?.count > 0;
	}

	// Guide can start chat if:
	// 1. Traveler has sent a message, OR
	// 2. Payment is completed
	const canStartChat = hasTravelerMessages || hasCompletedPayment;

	// Decrypt traveler data before returning
	const offer = {
		...offerDetails[0],
		traveler: offerDetails[0].traveler
			? decryptUserFields(offerDetails[0].traveler)
			: offerDetails[0].traveler
	};

	return {
		offer,
		review: reviewData[0] || null,
		canStartChat,
		hasCompletedPayment,
		hasTravelerMessages
	};
};

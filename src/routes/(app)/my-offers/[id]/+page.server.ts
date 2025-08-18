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

export const load = async ({ params, locals }) => {
	// Session and user are guaranteed to exist and be valid due to auth guard in hooks.server.ts
	const session = locals.session;
	const user = locals.user;

	console.log('Offer detail page - Session from locals:', !!session, 'User from locals:', !!user);
	console.log('Offer detail page - User role:', user?.role);
	console.log('Offer detail page - Access granted for guide:', user?.email);

	const offerId = params.id;

	if (!offerId) {
		throw redirect(302, '/my-offers');
	}

	// Fetch detailed offer information
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
		.where(and(eq(offers.id, offerId), eq(offers.guideId, user?.id || '')))
		.limit(1);

	if (offerDetails.length === 0) {
		throw redirect(302, '/my-offers');
	}

	// Check if review request exists for this offer
	const reviewData = await db
		.select({
			id: reviews.id,
			reviewRequestedAt: reviews.reviewRequestedAt,
			content: reviews.content,
			rating: reviews.rating
		})
		.from(reviews)
		.where(and(eq(reviews.offerId, offerId), eq(reviews.guideId, user?.id || '')))
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
		traveler: offerDetails[0].traveler ? decryptUserFields(offerDetails[0].traveler) : offerDetails[0].traveler
	};

	return {
		offer,
		review: reviewData[0] || null,
		canStartChat,
		hasCompletedPayment,
		hasTravelerMessages
	};
};

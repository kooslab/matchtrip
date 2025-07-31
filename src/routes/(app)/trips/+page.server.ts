import { db } from '$lib/server/db';
import {
	trips,
	destinations,
	users,
	offers,
	conversations,
	countries,
	continents
} from '$lib/server/db/schema';
import { eq, and, ne, inArray, gte, lte } from 'drizzle-orm';

export const load = async ({ locals, url }) => {
	// Session and user are guaranteed to exist and be valid due to auth guard in hooks.server.ts
	const session = locals.session;
	const user = locals.user;

	// Get filter parameters from URL
	const destinationIds =
		url.searchParams
			.get('destinations')
			?.split(',')
			.filter(Boolean)
			.map((id) => parseInt(id)) || [];
	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');
	const adults = url.searchParams.get('adults');
	const children = url.searchParams.get('children');
	const budgetMin = url.searchParams.get('budgetMin');
	const budgetMax = url.searchParams.get('budgetMax');

	console.log('Trips page - Session from locals:', !!session, 'User from locals:', !!user);
	console.log('Trips page - User role:', user?.role);
	console.log('Trips page - Access granted for guide:', user?.email);
	console.log('Trips page - Filter params:', {
		destinationIds,
		startDate,
		endDate,
		adults,
		children,
		budgetMin,
		budgetMax
	});

	// Fetch trips that are submitted (available for guides to make offers)
	// Include both trips without offers and trips where current guide has made offers
	// Exclude cancelled, completed, and accepted trips
	const availableTrips = await db
		.select({
			id: trips.id,
			userId: trips.userId,
			destinationId: trips.destinationId,
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
				name: users.name,
				email: users.email
			},
			// Check if current guide has made an offer
			hasOffer: offers.id,
			// Get offer details if exists
			offerId: offers.id,
			offerPrice: offers.price,
			offerStatus: offers.status,
			// Get conversation details if exists
			conversationId: conversations.id
		})
		.from(trips)
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(countries, eq(destinations.countryId, countries.id))
		.innerJoin(continents, eq(countries.continentId, continents.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.leftJoin(offers, and(eq(offers.tripId, trips.id), eq(offers.guideId, session.user.id)))
		.leftJoin(conversations, eq(conversations.offerId, offers.id))
		.where(
			and(
				eq(trips.status, 'submitted'),
				ne(trips.userId, session.user.id), // Don't show guide's own trips
				// Destination filter
				destinationIds.length > 0 ? inArray(trips.destinationId, destinationIds) : undefined,
				// Date filters
				startDate ? gte(trips.startDate, new Date(startDate)) : undefined,
				endDate ? lte(trips.endDate, new Date(endDate)) : undefined,
				// People filters
				adults ? eq(trips.adultsCount, parseInt(adults)) : undefined,
				children ? eq(trips.childrenCount, parseInt(children)) : undefined,
				// Budget filters
				budgetMin ? gte(trips.budgetMin, parseInt(budgetMin)) : undefined,
				budgetMax ? lte(trips.budgetMax, parseInt(budgetMax)) : undefined
			)
		)
		.orderBy(trips.createdAt);

	// Get all destinations with their countries
	const allDestinations = await db
		.select({
			destination: destinations,
			country: countries
		})
		.from(destinations)
		.innerJoin(countries, eq(destinations.countryId, countries.id))
		.orderBy(countries.name, destinations.city);

	// Transform to expected format
	const availableDestinations = allDestinations.map((row) => ({
		id: row.destination.id,
		city: row.destination.city,
		nameEn: row.destination.nameEn,
		nameLocal: row.destination.nameLocal,
		countryId: row.destination.countryId,
		country: {
			id: row.country.id,
			name: row.country.name,
			code: row.country.code
		}
	}));

	return {
		trips: availableTrips,
		destinations: availableDestinations,
		userRole: user?.role || null,
		isGuideVerified: (user as any)?.guideProfile?.isVerified || false
	};
};

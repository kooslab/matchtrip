import { db } from '$lib/server/db';
import { trips, destinations, users, offers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;
	let user = locals.user;

	console.log('My-offers page - Session from locals:', !!session, 'User from locals:', !!user);
	console.log('My-offers page - locals object keys:', Object.keys(locals));

	// If no session in locals, get it directly
	if (!session) {
		console.log('My-offers page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });

		if (session?.user?.id) {
			user = await db.query.users.findFirst({
				where: eq(users.id, session.user.id),
				columns: {
					id: true,
					role: true,
					name: true,
					email: true
				}
			});
		}
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('My-offers page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	// Only allow guides to access this page
	if (!user || user.role !== 'guide') {
		console.log('My-offers page - Not a guide, redirecting to home');
		throw redirect(302, '/');
	}

	// Fetch all offers made by the current guide
	const myOffers = await db
		.select({
			id: offers.id,
			tripId: offers.tripId,
			price: offers.price,
			title: offers.title,
			description: offers.description,
			status: offers.status,
			createdAt: offers.createdAt,
			updatedAt: offers.updatedAt,
			// Trip info
			trip: {
				id: trips.id,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				startDate: trips.startDate,
				endDate: trips.endDate,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status
			},
			// Destination info
			destination: {
				city: destinations.city,
				country: destinations.country
			},
			// Traveler info
			traveler: {
				name: users.name,
				email: users.email
			}
		})
		.from(offers)
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.innerJoin(destinations, eq(trips.destinationId, destinations.id))
		.innerJoin(users, eq(trips.userId, users.id))
		.where(eq(offers.guideId, session.user.id))
		.orderBy(offers.createdAt);

	// Group offers by status
	const groupedOffers = {
		pending: myOffers.filter((offer) => offer.status === 'pending'),
		accepted: myOffers.filter((offer) => offer.status === 'accepted'),
		rejected: myOffers.filter((offer) => offer.status === 'rejected')
	};

	return {
		offers: groupedOffers,
		totalOffers: myOffers.length
	};
};

import { db } from '$lib/server/db';
import { trips, destinations, users, offers, payments } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;

	console.log('Order history page - Session from locals:', !!session);

	// If no session in locals, get it directly
	if (!session) {
		console.log('Order history page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('Order history page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	// Fetch trips with accepted offers and payments
	const paidTrips = await db
		.select({
			tripId: trips.id,
			tripUserId: trips.userId,
			adultsCount: trips.adultsCount,
			childrenCount: trips.childrenCount,
			startDate: trips.startDate,
			endDate: trips.endDate,
			travelMethod: trips.travelMethod,
			customRequest: trips.customRequest,
			tripStatus: trips.status,
			tripCreatedAt: trips.createdAt,
			destinationId: destinations.id,
			destinationCity: destinations.city,
			destinationCountry: destinations.country,
			offerId: offers.id,
			offerPrice: offers.price,
			offerItinerary: offers.itinerary,
			offerStatus: offers.status,
			offerCreatedAt: offers.createdAt,
			guideId: users.id,
			guideName: users.name,
			guideEmail: users.email,
			paymentId: payments.id,
			paymentAmount: payments.amount,
			paymentStatus: payments.status,
			paymentKey: payments.paymentKey,
			paymentOrderId: payments.orderId,
			paymentMethod: payments.paymentMethod,
			paymentCreatedAt: payments.createdAt
		})
		.from(trips)
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(offers, and(eq(offers.tripId, trips.id), eq(offers.status, 'accepted')))
		.leftJoin(users, eq(offers.guideId, users.id))
		.leftJoin(payments, and(eq(payments.offerId, offers.id), or(eq(payments.status, 'completed'))))
		.where(and(eq(trips.userId, session.user.id), eq(trips.status, 'accepted')));

	// Filter out trips without payments and transform to expected structure
	const completedOrders = paidTrips
		.filter((trip) => trip.paymentId)
		.map((trip) => ({
			id: trip.tripId,
			userId: trip.tripUserId,
			adultsCount: trip.adultsCount,
			childrenCount: trip.childrenCount,
			startDate: trip.startDate,
			endDate: trip.endDate,
			travelMethod: trip.travelMethod,
			customRequest: trip.customRequest,
			status: trip.tripStatus,
			createdAt: trip.tripCreatedAt,
			destination: trip.destinationId
				? {
						id: trip.destinationId,
						city: trip.destinationCity,
						country: trip.destinationCountry
					}
				: null,
			offer: trip.offerId
				? {
						id: trip.offerId,
						price: trip.offerPrice,
						itinerary: trip.offerItinerary,
						status: trip.offerStatus,
						createdAt: trip.offerCreatedAt
					}
				: null,
			guide: trip.guideId
				? {
						id: trip.guideId,
						name: trip.guideName,
						email: trip.guideEmail
					}
				: null,
			payment: {
				id: trip.paymentId,
				amount: trip.paymentAmount,
				status: trip.paymentStatus,
				paymentKey: trip.paymentKey,
				orderId: trip.paymentOrderId,
				createdAt: trip.paymentCreatedAt
			}
		}));

	return {
		orders: completedOrders
	};
};

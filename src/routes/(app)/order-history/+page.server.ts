import { db } from '$lib/server/db';
import { trips, destinations, users, offers, payments, countries } from '$lib/server/db/schema';
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

	// First, let's check if there are any payments for this user
	console.log('Fetching orders for user:', session.user.id);

	// Get all payments for this user first
	const userPayments = await db.select().from(payments).where(eq(payments.userId, session.user.id));

	console.log('User payments found:', userPayments.length);
	console.log(
		'Payment statuses:',
		userPayments.map((p) => p.status)
	);

	// Now get the full trip data with payments
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
			destinationCountryName: countries.name,
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
		.from(payments)
		.innerJoin(offers, eq(payments.offerId, offers.id))
		.innerJoin(trips, eq(offers.tripId, trips.id))
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(countries, eq(destinations.countryId, countries.id))
		.leftJoin(users, eq(offers.guideId, users.id))
		.where(
			and(
				eq(payments.userId, session.user.id),
				or(eq(payments.status, 'completed'), eq(payments.status, 'cancelled'))
			)
		);

	console.log('Found paid trips:', paidTrips.length);
	console.log('Sample trip:', paidTrips[0]);

	// Transform to expected structure - no need to filter since we start from payments
	const completedOrders = paidTrips.map((trip) => ({
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
					country: trip.destinationCountryName
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

	console.log('Filtered orders:', completedOrders.length);
	console.log('Orders:', completedOrders);

	return {
		orders: completedOrders
	};
};

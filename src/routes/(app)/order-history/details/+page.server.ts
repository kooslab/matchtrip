import { db } from '$lib/server/db';
import { trips, destinations, users, offers, payments, countries } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ url, request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;

	console.log('Order details page - Session from locals:', !!session);

	// If no session in locals, get it directly
	if (!session) {
		console.log('Order details page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('Order details page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	const paymentId = url.searchParams.get('id');

	if (!paymentId) {
		throw redirect(302, '/order-history');
	}

	// Fetch order details
	const orderDetails = await db
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
			paymentCreatedAt: payments.createdAt,
			paymentPaidAt: payments.paidAt
		})
		.from(payments)
		.leftJoin(offers, eq(payments.offerId, offers.id))
		.leftJoin(trips, eq(payments.tripId, trips.id))
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(countries, eq(destinations.countryId, countries.id))
		.leftJoin(users, eq(offers.guideId, users.id))
		.where(and(eq(payments.id, paymentId), eq(payments.userId, session.user.id)))
		.limit(1);

	if (orderDetails.length === 0) {
		throw redirect(302, '/order-history');
	}

	const order = orderDetails[0];

	// Transform to expected structure
	const orderData = {
		id: order.tripId,
		userId: order.tripUserId,
		adultsCount: order.adultsCount,
		childrenCount: order.childrenCount,
		startDate: order.startDate,
		endDate: order.endDate,
		travelMethod: order.travelMethod,
		customRequest: order.customRequest,
		status: order.tripStatus,
		createdAt: order.tripCreatedAt,
		destination: order.destinationId
			? {
					id: order.destinationId,
					city: order.destinationCity,
					country: order.destinationCountryName
				}
			: null,
		offer: order.offerId
			? {
					id: order.offerId,
					price: order.offerPrice,
					itinerary: order.offerItinerary,
					status: order.offerStatus,
					createdAt: order.offerCreatedAt
				}
			: null,
		guide: order.guideId
			? {
					id: order.guideId,
					name: order.guideName,
					email: order.guideEmail
				}
			: null,
		payment: {
			id: order.paymentId,
			amount: order.paymentAmount,
			status: order.paymentStatus,
			paymentKey: order.paymentKey,
			orderId: order.paymentOrderId,
			paymentMethod: order.paymentMethod,
			createdAt: order.paymentCreatedAt,
			paidAt: order.paymentPaidAt
		}
	};

	return {
		order: orderData
	};
};

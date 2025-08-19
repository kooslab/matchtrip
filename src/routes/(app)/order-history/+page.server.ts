import { db } from '$lib/server/db';
import {
	trips,
	destinations,
	users,
	offers,
	payments,
	countries,
	products,
	productOffers
} from '$lib/server/db/schema';
import { eq, and, or, isNotNull } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { decryptUserFields } from '$lib/server/encryption';

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
		throw redirect(302, '/');
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

	// Get trip-based payments
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
			paymentCreatedAt: payments.createdAt,
			paidAt: payments.paidAt
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
				isNotNull(payments.offerId),
				or(eq(payments.status, 'completed'), eq(payments.status, 'cancelled'))
			)
		);

	// Get product-based payments
	const paidProducts = await db
		.select({
			productId: products.id,
			productTitle: products.title,
			productDescription: products.description,
			productPrice: products.price,
			productDuration: products.duration,
			productCreatedAt: products.createdAt,
			productOfferId: productOffers.id,
			productOfferPrice: productOffers.price,
			productOfferDuration: productOffers.duration,
			productOfferStatus: productOffers.status,
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
			paidAt: payments.paidAt
		})
		.from(payments)
		.innerJoin(products, eq(payments.productId, products.id))
		.leftJoin(productOffers, eq(payments.productOfferId, productOffers.id))
		.leftJoin(users, eq(products.guideId, users.id))
		.where(
			and(
				eq(payments.userId, session.user.id),
				isNotNull(payments.productId),
				or(eq(payments.status, 'completed'), eq(payments.status, 'cancelled'))
			)
		);

	console.log('Found paid trips:', paidTrips.length);
	console.log('Found paid products:', paidProducts.length);

	// Transform trip orders
	const tripOrders = paidTrips.map((trip) => {
		// Decrypt guide information if present
		const decryptedGuide = trip.guideId && trip.guideName && trip.guideEmail
			? decryptUserFields({
					id: trip.guideId,
					name: trip.guideName,
					email: trip.guideEmail
				})
			: null;

		return {
			type: 'trip' as const,
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
			guide: decryptedGuide,
			payment: {
				id: trip.paymentId,
				amount: trip.paymentAmount,
				status: trip.paymentStatus,
				paymentKey: trip.paymentKey,
				orderId: trip.paymentOrderId,
				createdAt: trip.paymentCreatedAt,
				paidAt: trip.paidAt
			}
		};
	});

	// Transform product orders
	const productOrders = paidProducts.map((product) => {
		// Decrypt guide information if present
		const decryptedGuide = product.guideId && product.guideName && product.guideEmail
			? decryptUserFields({
					id: product.guideId,
					name: product.guideName,
					email: product.guideEmail
				})
			: null;

		return {
			type: 'product' as const,
			id: product.productId,
			productTitle: product.productTitle,
			productDescription: product.productDescription,
			productPrice: product.productPrice,
			productDuration: product.productDuration,
			createdAt: product.productCreatedAt,
			productOffer: product.productOfferId
				? {
						id: product.productOfferId,
						price: product.productOfferPrice,
						duration: product.productOfferDuration,
						status: product.productOfferStatus
					}
				: null,
			guide: decryptedGuide,
			payment: {
				id: product.paymentId,
				amount: product.paymentAmount,
				status: product.paymentStatus,
				paymentKey: product.paymentKey,
				orderId: product.paymentOrderId,
				createdAt: product.paymentCreatedAt,
				paidAt: product.paidAt
			}
		};
	});

	// Combine and sort by payment date (most recent first)
	const allOrders = [...tripOrders, ...productOrders].sort((a, b) => {
		const dateA = new Date(a.payment.createdAt).getTime();
		const dateB = new Date(b.payment.createdAt).getTime();
		return dateB - dateA;
	});

	console.log('Total orders:', allOrders.length);
	console.log('Trip orders:', tripOrders.length);
	console.log('Product orders:', productOrders.length);

	return {
		orders: allOrders
	};
};

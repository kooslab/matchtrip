import { db } from '$lib/server/db';
import { trips, destinations, users, offers, payments, countries, products, productOffers, conversations, productConversations } from '$lib/server/db/schema';
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
		throw redirect(302, '/');
	}

	const paymentId = url.searchParams.get('id');

	if (!paymentId) {
		throw redirect(302, '/order-history');
	}

	// First check if this payment exists and belongs to the user
	const payment = await db
		.select()
		.from(payments)
		.where(and(eq(payments.id, paymentId), eq(payments.userId, session.user.id)))
		.limit(1);

	if (payment.length === 0) {
		throw redirect(302, '/order-history');
	}

	const paymentRecord = payment[0];

	// Check if it's a trip or product payment
	if (paymentRecord.tripId || paymentRecord.offerId) {
		// Trip payment - fetch trip details
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
				paymentPaidAt: payments.paidAt,
				paymentUpdatedAt: payments.updatedAt
			})
			.from(payments)
			.leftJoin(offers, eq(payments.offerId, offers.id))
			.leftJoin(trips, eq(payments.tripId, trips.id))
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.leftJoin(users, eq(offers.guideId, users.id))
			.where(eq(payments.id, paymentId))
			.limit(1);

		const order = orderDetails[0];
		
		// Get conversation ID for the offer
		let conversationId = null;
		if (order.offerId) {
			const conv = await db
				.select({ id: conversations.id })
				.from(conversations)
				.where(eq(conversations.offerId, order.offerId))
				.limit(1);
			if (conv.length > 0) {
				conversationId = conv[0].id;
			}
		}

		// Transform to expected structure for trip
		const orderData = {
			type: 'trip',
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
			conversationId,
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
				paidAt: order.paymentPaidAt,
				updatedAt: order.paymentUpdatedAt
			}
		};

		return {
			order: orderData
		};
	} else if (paymentRecord.productId) {
		// Product payment - fetch product details
		const productDetails = await db
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
				paymentPaidAt: payments.paidAt,
				paymentUpdatedAt: payments.updatedAt
			})
			.from(payments)
			.innerJoin(products, eq(payments.productId, products.id))
			.leftJoin(productOffers, eq(payments.productOfferId, productOffers.id))
			.leftJoin(users, eq(products.guideId, users.id))
			.where(eq(payments.id, paymentId))
			.limit(1);

		const product = productDetails[0];
		
		// Get conversation ID for the product
		let conversationId = null;
		if (product.productId) {
			const conv = await db
				.select({ id: productConversations.id })
				.from(productConversations)
				.where(and(
					eq(productConversations.productId, product.productId),
					eq(productConversations.travelerId, session.user.id)
				))
				.limit(1);
			if (conv.length > 0) {
				conversationId = conv[0].id;
			}
		}

		// Transform to expected structure for product
		const orderData = {
			type: 'product',
			id: product.productId,
			productTitle: product.productTitle,
			productDescription: product.productDescription,
			productPrice: product.productPrice,
			productDuration: product.productDuration,
			createdAt: product.productCreatedAt,
			conversationId,
			productOffer: product.productOfferId
				? {
						id: product.productOfferId,
						price: product.productOfferPrice,
						duration: product.productOfferDuration,
						status: product.productOfferStatus
					}
				: null,
			guide: product.guideId
				? {
						id: product.guideId,
						name: product.guideName,
						email: product.guideEmail
					}
				: null,
			payment: {
				id: product.paymentId,
				amount: product.paymentAmount,
				status: product.paymentStatus,
				paymentKey: product.paymentKey,
				orderId: product.paymentOrderId,
				paymentMethod: product.paymentMethod,
				createdAt: product.paymentCreatedAt,
				paidAt: product.paymentPaidAt,
				updatedAt: product.paymentUpdatedAt
			}
		};

		return {
			order: orderData
		};
	}

	// Fallback - should not reach here
	throw redirect(302, '/order-history');
};

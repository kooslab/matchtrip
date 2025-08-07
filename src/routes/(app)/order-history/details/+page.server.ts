import { db } from '$lib/server/db';
import { trips, destinations, users, offers, payments, countries, products, productOffers, conversations, productConversations, reviews, travelerProfiles } from '$lib/server/db/schema';
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

	try {
		// First, get the payment record with a simple query
		const paymentResults = await db
			.select()
			.from(payments)
			.where(and(eq(payments.id, paymentId), eq(payments.userId, session.user.id)));

		if (paymentResults.length === 0) {
			throw redirect(302, '/order-history');
		}

		const paymentRecord = paymentResults[0];

		// Get user details
		const userResults = await db
			.select()
			.from(users)
			.where(eq(users.id, session.user.id));

		const userRecord = userResults[0];

		// Get traveler profile for phone number
		const profileResults = await db
			.select()
			.from(travelerProfiles)
			.where(eq(travelerProfiles.userId, session.user.id));

		const userData = {
			id: userRecord?.id || session.user.id,
			name: userRecord?.name || session.user.name || '알 수 없음',
			email: userRecord?.email || session.user.email,
			phone: profileResults[0]?.phone || null
		};

		// Initialize order data
		let orderData: any = {
			payment: {
				id: paymentRecord.id,
				amount: paymentRecord.amount,
				status: paymentRecord.status,
				paymentKey: paymentRecord.paymentKey,
				orderId: paymentRecord.orderId,
				paymentMethod: paymentRecord.paymentMethod,
				createdAt: paymentRecord.createdAt,
				paidAt: paymentRecord.paidAt,
				updatedAt: paymentRecord.updatedAt
			},
			user: userData,
			review: null
		};

		// Check if it's a trip or product payment
		if (paymentRecord.tripId || paymentRecord.offerId) {
			// Handle trip payment
			orderData.type = 'trip';

			// Get offer if exists
			if (paymentRecord.offerId) {
				const offerResults = await db
					.select()
					.from(offers)
					.where(eq(offers.id, paymentRecord.offerId));

				if (offerResults.length > 0) {
					const offerRecord = offerResults[0];
					orderData.offer = {
						id: offerRecord.id,
						price: offerRecord.price,
						itinerary: offerRecord.itinerary,
						status: offerRecord.status,
						createdAt: offerRecord.createdAt
					};

					// Get trip through offer
					if (offerRecord.tripId) {
						const tripResults = await db
							.select()
							.from(trips)
							.where(eq(trips.id, offerRecord.tripId));

						if (tripResults.length > 0) {
							const tripRecord = tripResults[0];
							orderData.id = tripRecord.id;
							orderData.userId = tripRecord.userId;
							orderData.adultsCount = tripRecord.adultsCount;
							orderData.childrenCount = tripRecord.childrenCount;
							orderData.startDate = tripRecord.startDate;
							orderData.endDate = tripRecord.endDate;
							orderData.travelMethod = tripRecord.travelMethod;
							orderData.customRequest = tripRecord.customRequest;
							orderData.status = tripRecord.status;
							orderData.createdAt = tripRecord.createdAt;

							// Get destination
							if (tripRecord.destinationId) {
								const destResults = await db
									.select()
									.from(destinations)
									.where(eq(destinations.id, tripRecord.destinationId));

								if (destResults.length > 0) {
									const destRecord = destResults[0];
									orderData.destination = {
										id: destRecord.id,
										city: destRecord.city,
										country: null
									};

									// Get country
									if (destRecord.countryId) {
										const countryResults = await db
											.select()
											.from(countries)
											.where(eq(countries.id, destRecord.countryId));

										if (countryResults.length > 0) {
											orderData.destination.country = countryResults[0].name;
										}
									}
								}
							}
						}
					}

					// Get guide info
					if (offerRecord.guideId) {
						const guideResults = await db
							.select()
							.from(users)
							.where(eq(users.id, offerRecord.guideId));

						if (guideResults.length > 0) {
							orderData.guide = {
								id: guideResults[0].id,
								name: guideResults[0].name,
								email: guideResults[0].email
							};
						}
					}
				}
			} else if (paymentRecord.tripId) {
				// Direct trip payment without offer
				const tripResults = await db
					.select()
					.from(trips)
					.where(eq(trips.id, paymentRecord.tripId));

				if (tripResults.length > 0) {
					const tripRecord = tripResults[0];
					orderData.id = tripRecord.id;
					orderData.userId = tripRecord.userId;
					orderData.adultsCount = tripRecord.adultsCount;
					orderData.childrenCount = tripRecord.childrenCount;
					orderData.startDate = tripRecord.startDate;
					orderData.endDate = tripRecord.endDate;
					orderData.travelMethod = tripRecord.travelMethod;
					orderData.customRequest = tripRecord.customRequest;
					orderData.status = tripRecord.status;
					orderData.createdAt = tripRecord.createdAt;

					// Get destination
					if (tripRecord.destinationId) {
						const destResults = await db
							.select()
							.from(destinations)
							.where(eq(destinations.id, tripRecord.destinationId));

						if (destResults.length > 0) {
							const destRecord = destResults[0];
							orderData.destination = {
								id: destRecord.id,
								city: destRecord.city,
								country: null
							};

							// Get country
							if (destRecord.countryId) {
								const countryResults = await db
									.select()
									.from(countries)
									.where(eq(countries.id, destRecord.countryId));

								if (countryResults.length > 0) {
									orderData.destination.country = countryResults[0].name;
								}
							}
						}
					}
				}
			}

			// Get conversation ID
			if (orderData.offer?.id) {
				const convResults = await db
					.select()
					.from(conversations)
					.where(eq(conversations.offerId, orderData.offer.id));

				if (convResults.length > 0) {
					orderData.conversationId = convResults[0].id;
				}
			}

			// Get review if trip exists
			if (orderData.id) {
				const reviewResults = await db
					.select()
					.from(reviews)
					.where(
						and(
							eq(reviews.tripId, orderData.id),
							eq(reviews.travelerId, session.user.id)
						)
					);

				if (reviewResults.length > 0) {
					orderData.review = {
						id: reviewResults[0].id,
						rating: reviewResults[0].rating,
						content: reviewResults[0].content,
						images: reviewResults[0].images,
						tags: reviewResults[0].tags,
						createdAt: reviewResults[0].createdAt
					};
				}
			}
		} else if (paymentRecord.productId) {
			// Handle product payment
			orderData.type = 'product';

			const productResults = await db
				.select()
				.from(products)
				.where(eq(products.id, paymentRecord.productId));

			if (productResults.length > 0) {
				const productRecord = productResults[0];
				orderData.id = productRecord.id;
				orderData.productTitle = productRecord.title;
				orderData.productDescription = productRecord.description;
				orderData.productPrice = productRecord.price;
				orderData.productDuration = productRecord.duration;
				orderData.createdAt = productRecord.createdAt;

				// Get product offer if exists
				if (paymentRecord.productOfferId) {
					const offerResults = await db
						.select()
						.from(productOffers)
						.where(eq(productOffers.id, paymentRecord.productOfferId));

					if (offerResults.length > 0) {
						orderData.productOffer = {
							id: offerResults[0].id,
							price: offerResults[0].price,
							duration: offerResults[0].duration,
							status: offerResults[0].status
						};
					}
				}

				// Get guide info
				if (productRecord.guideId) {
					const guideResults = await db
						.select()
						.from(users)
						.where(eq(users.id, productRecord.guideId));

					if (guideResults.length > 0) {
						orderData.guide = {
							id: guideResults[0].id,
							name: guideResults[0].name,
							email: guideResults[0].email
						};
					}
				}

				// Get conversation ID for product
				const convResults = await db
					.select()
					.from(productConversations)
					.where(
						and(
							eq(productConversations.productId, productRecord.id),
							eq(productConversations.travelerId, session.user.id)
						)
					);

				if (convResults.length > 0) {
					orderData.conversationId = convResults[0].id;
				}
			}
		}

		return {
			order: orderData
		};
	} catch (error) {
		console.error('Error loading order details:', error);
		throw redirect(302, '/order-history');
	}
};
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, trips, offers } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomBytes } from 'crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { tripId, rating, content } = await request.json();

		// Validate input
		if (!tripId || !rating || !content) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (rating < 1 || rating > 5) {
			return json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
		}

		if (content.trim().length < 10) {
			return json({ error: 'Review must be at least 10 characters long' }, { status: 400 });
		}

		// Get trip details and verify the user is the traveler
		const trip = await db.query.trips.findFirst({
			where: and(eq(trips.id, tripId), eq(trips.userId, session.user.id)),
			with: {
				offers: {
					where: eq(offers.status, 'accepted'),
					limit: 1
				}
			}
		});

		if (!trip) {
			return json({ error: 'Trip not found or you are not the traveler' }, { status: 404 });
		}

		// Check if trip is completed
		if (trip.status !== 'completed') {
			return json({ error: 'You can only review completed trips' }, { status: 400 });
		}

		// Get accepted offer
		const acceptedOffer = trip.offers[0];
		if (!acceptedOffer) {
			return json({ error: 'No accepted offer found for this trip' }, { status: 404 });
		}

		// Check if review already exists
		const existingReview = await db.query.reviews.findFirst({
			where: and(eq(reviews.tripId, tripId), eq(reviews.travelerId, session.user.id))
		});

		if (existingReview) {
			return json({ error: 'You have already reviewed this trip' }, { status: 400 });
		}

		// Create the review
		const [review] = await db
			.insert(reviews)
			.values({
				tripId,
				offerId: acceptedOffer.id,
				guideId: acceptedOffer.guideId,
				travelerId: session.user.id,
				rating,
				content: content.trim(),
				reviewToken: randomBytes(32).toString('hex')
			})
			.returning();

		return json({ success: true, review });
	} catch (error) {
		console.error('Error creating review:', error);
		return json({ error: 'Failed to create review' }, { status: 500 });
	}
};

// Get reviews for a guide
export const GET: RequestHandler = async ({ url }) => {
	try {
		const guideId = url.searchParams.get('guideId');
		const limit = parseInt(url.searchParams.get('limit') || '10');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		if (!guideId) {
			return json({ error: 'Guide ID is required' }, { status: 400 });
		}

		// Fetch reviews with traveler information
		const guideReviews = await db.query.reviews.findMany({
			where: eq(reviews.guideId, guideId),
			with: {
				traveler: {
					columns: {
						id: true,
						name: true,
						image: true
					}
				},
				trip: {
					columns: {
						id: true,
						startDate: true,
						endDate: true
					},
					with: {
						destination: true
					}
				}
			},
			orderBy: [desc(reviews.createdAt)],
			limit,
			offset
		});

		// Calculate average rating
		const allReviews = await db.query.reviews.findMany({
			where: eq(reviews.guideId, guideId),
			columns: { rating: true }
		});

		const avgRating = allReviews.length > 0
			? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
			: 0;

		return json({
			reviews: guideReviews,
			totalCount: allReviews.length,
			averageRating: Math.round(avgRating * 10) / 10
		});
	} catch (error) {
		console.error('Error fetching reviews:', error);
		return json({ error: 'Failed to fetch reviews' }, { status: 500 });
	}
};
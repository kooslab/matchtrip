import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, trips, offers, users, destinations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendReviewRequestEmail } from '$lib/server/email/reviewRequest';

// Create a review request (called by guide after trip completion)
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { tripId } = await request.json();

		if (!tripId) {
			return json({ error: 'Trip ID is required' }, { status: 400 });
		}

		// Verify the user is the guide for this trip
		const trip = await db.query.trips.findFirst({
			where: eq(trips.id, tripId),
			with: {
				offers: {
					where: and(eq(offers.guideId, session.user.id), eq(offers.status, 'accepted')),
					limit: 1
				},
				user: {
					columns: {
						id: true,
						email: true,
						name: true
					}
				},
				destination: true
			}
		});

		if (!trip || trip.offers.length === 0) {
			return json({ error: 'Trip not found or you are not the guide' }, { status: 404 });
		}

		// Check if trip is completed
		if (trip.status !== 'completed') {
			return json({ error: 'Trip must be completed before requesting a review' }, { status: 400 });
		}

		const acceptedOffer = trip.offers[0];

		// Check if review already exists or was requested
		const existingReview = await db.query.reviews.findFirst({
			where: and(eq(reviews.tripId, tripId), eq(reviews.travelerId, trip.userId))
		});

		if (existingReview && existingReview.content) {
			return json({ error: 'Review already submitted for this trip' }, { status: 400 });
		}

		const reviewToken = randomBytes(32).toString('hex');

		if (existingReview && !existingReview.content) {
			// Update existing review request
			await db
				.update(reviews)
				.set({
					reviewToken,
					reviewRequestedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(reviews.id, existingReview.id));
		} else {
			// Create new review request
			await db.insert(reviews).values({
				tripId,
				offerId: acceptedOffer.id,
				guideId: session.user.id,
				travelerId: trip.userId,
				rating: 0, // Placeholder, will be updated when review is submitted
				content: '', // Empty content indicates pending review
				reviewToken,
				reviewRequestedAt: new Date()
			});
		}

		// Get guide information
		const guide = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: {
				name: true
			}
		});

		// Send review request email
		try {
			await sendReviewRequestEmail({
				travelerName: trip.user.name,
				travelerEmail: trip.user.email,
				guideName: guide?.name || 'Guide',
				destination: trip.destination
					? `${trip.destination.city}, ${trip.destination.country}`
					: 'Your destination',
				tripDates: {
					start: new Date(trip.startDate).toLocaleDateString('ko-KR'),
					end: new Date(trip.endDate).toLocaleDateString('ko-KR')
				},
				reviewToken
			});
		} catch (emailError) {
			console.error('Failed to send review email:', emailError);
			// Continue even if email fails
		}

		return json({
			success: true,
			message: 'Review request sent successfully',
			travelerEmail: trip.user.email
		});
	} catch (error) {
		console.error('Error creating review request:', error);
		return json({ error: 'Failed to create review request' }, { status: 500 });
	}
};

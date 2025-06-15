import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, trips, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Submit a review using a token (from email link)
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user?.id) {
			return json({ error: 'Please log in to submit a review' }, { status: 401 });
		}

		const { token, rating, content } = await request.json();

		// Validate input
		if (!token || !rating || !content) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (rating < 1 || rating > 5) {
			return json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
		}

		if (content.trim().length < 10) {
			return json({ error: 'Review must be at least 10 characters long' }, { status: 400 });
		}

		// Find review by token
		const review = await db.query.reviews.findFirst({
			where: eq(reviews.reviewToken, token),
			with: {
				trip: true
			}
		});

		if (!review) {
			return json({ error: 'Invalid review token' }, { status: 404 });
		}

		// Verify the logged-in user is the traveler
		if (review.travelerId !== session.user.id) {
			return json({ error: 'You are not authorized to submit this review' }, { status: 403 });
		}

		// Check if review was already submitted
		if (review.content && review.rating > 0) {
			return json({ error: 'Review has already been submitted' }, { status: 400 });
		}

		// Update the review with actual content and rating
		const [updatedReview] = await db
			.update(reviews)
			.set({
				rating,
				content: content.trim(),
				updatedAt: new Date()
			})
			.where(eq(reviews.id, review.id))
			.returning();

		return json({ success: true, review: updatedReview });
	} catch (error) {
		console.error('Error submitting review:', error);
		return json({ error: 'Failed to submit review' }, { status: 500 });
	}
};

// Get review details by token (for displaying the review form)
export const GET: RequestHandler = async ({ url }) => {
	try {
		const token = url.searchParams.get('token');

		if (!token) {
			return json({ error: 'Token is required' }, { status: 400 });
		}

		const review = await db.query.reviews.findFirst({
			where: eq(reviews.reviewToken, token),
			with: {
				trip: {
					with: {
						destination: true
					}
				},
				guide: {
					columns: {
						id: true,
						name: true,
						image: true
					}
				},
				offer: {
					columns: {
						title: true,
						description: true
					}
				}
			}
		});

		if (!review) {
			return json({ error: 'Invalid review token' }, { status: 404 });
		}

		// Check if review was already submitted
		const isSubmitted = review.content && review.rating > 0;

		return json({
			review,
			isSubmitted,
			trip: review.trip,
			guide: review.guide,
			offer: review.offer
		});
	} catch (error) {
		console.error('Error fetching review:', error);
		return json({ error: 'Failed to fetch review details' }, { status: 500 });
	}
};
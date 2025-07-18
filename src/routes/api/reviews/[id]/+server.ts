import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { reviews } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	const session = locals.session;
	const user = locals.user;
	
	if (!session || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const reviewId = params.id;
	const { rating, content, images, tags } = await request.json();

	// Validate input
	if (!rating || rating < 1 || rating > 5) {
		return json({ error: 'Invalid rating. Must be between 1 and 5.' }, { status: 400 });
	}

	if (!content || content.trim().length < 10) {
		return json({ error: 'Review content must be at least 10 characters.' }, { status: 400 });
	}

	try {
		// Get the review
		const review = await db
			.select()
			.from(reviews)
			.where(eq(reviews.id, reviewId))
			.then(rows => rows[0]);

		if (!review) {
			return json({ error: 'Review not found' }, { status: 404 });
		}

		// Check if the current user is the traveler for this review
		if (review.travelerId !== user.id) {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}

		// Check if review is already submitted
		if (review.content && review.rating > 0) {
			return json({ error: 'Review already submitted' }, { status: 400 });
		}

		// Update the review
		const updateData: any = {
			rating,
			content: content.trim(),
			updatedAt: new Date()
		};
		
		// Add images if provided
		if (images && images.length > 0) {
			updateData.images = images;
		}
		
		// Add tags if provided
		if (tags && tags.length > 0) {
			updateData.tags = tags;
		}
		
		await db
			.update(reviews)
			.set(updateData)
			.where(eq(reviews.id, reviewId));

		return json({ success: true });
	} catch (error) {
		console.error('Error updating review:', error);
		return json({ error: 'Failed to update review' }, { status: 500 });
	}
};
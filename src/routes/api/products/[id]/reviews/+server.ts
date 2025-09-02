import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reviews, users, travelerProfiles } from '$lib/server/db/schema';
import { eq, desc, and, gt } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';
import { transformImageUrl } from '$lib/utils/imageUrl';

export const GET: RequestHandler = async ({ params }) => {
	const productId = params.id;

	try {
		// Fetch reviews for the product with traveler information
		const productReviews = await db
			.select({
				id: reviews.id,
				rating: reviews.rating,
				content: reviews.content,
				createdAt: reviews.createdAt,
				traveler: {
					id: users.id,
					name: users.name,
					email: users.email,
					image: users.image
				},
				travelerProfile: {
					username: travelerProfiles.username,
					profileImageUrl: travelerProfiles.profileImageUrl
				}
			})
			.from(reviews)
			.leftJoin(users, eq(reviews.travelerId, users.id))
			.leftJoin(travelerProfiles, eq(reviews.travelerId, travelerProfiles.userId))
			.where(
				and(
					eq(reviews.productId, productId),
					gt(reviews.rating, 0) // Only get reviews with actual ratings
				)
			)
			.orderBy(desc(reviews.createdAt));

		// Transform the reviews to decrypt user data and transform image URLs
		const transformedReviews = productReviews.map((review) => ({
			...review,
			traveler: review.traveler
				? {
						...decryptUserFields(review.traveler),
						image: transformImageUrl(review.traveler.image)
					}
				: null,
			travelerProfile: review.travelerProfile
				? {
						...review.travelerProfile,
						profileImageUrl: transformImageUrl(review.travelerProfile.profileImageUrl)
					}
				: null
		}));

		return json(transformedReviews);
	} catch (error) {
		console.error('Failed to fetch reviews:', error);
		return json({ error: 'Failed to fetch reviews' }, { status: 500 });
	}
};
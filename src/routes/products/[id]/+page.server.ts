import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products, destinations, countries, users, guideProfiles, reviews } from '$lib/server/db/schema';
import { eq, and, sql, count, avg } from 'drizzle-orm';
import { transformImageUrl } from '$lib/utils/imageUrl';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const productId = parseInt(params.id);
	
	if (isNaN(productId)) {
		throw error(404, 'Product not found');
	}

	// Import decryption utility
	const { decryptUserFields } = await import('$lib/server/encryption');

	// Get product with guide information
	const productResult = await db
		.select({
			id: products.id,
			title: products.title,
			description: products.description,
			price: products.price,
			currency: products.currency,
			duration: products.duration,
			imageUrl: products.imageUrl,
			maxParticipants: products.maxParticipants,
			minParticipants: products.minParticipants,
			languages: products.languages,
			destination: {
				id: destinations.id,
				city: destinations.city,
				country: {
					id: countries.id,
					name: countries.name
				}
			},
			guide: {
				id: users.id,
				name: users.name,
				email: users.email,
				image: users.image
			},
			guideProfile: {
				username: guideProfiles.username,
				profileImageUrl: guideProfiles.profileImageUrl,
				bio: guideProfiles.bio,
				yearsOfExperience: guideProfiles.yearsOfExperience
			}
		})
		.from(products)
		.leftJoin(destinations, eq(products.destinationId, destinations.id))
		.leftJoin(countries, eq(destinations.countryId, countries.id))
		.leftJoin(users, eq(products.guideId, users.id))
		.leftJoin(guideProfiles, eq(products.guideId, guideProfiles.userId))
		.where(and(
			eq(products.id, productId),
			eq(products.status, 'active')
		))
		.limit(1);

	if (productResult.length === 0) {
		throw error(404, 'Product not found');
	}

	const product = productResult[0];

	// Get review stats
	const reviewStats = await db
		.select({
			reviewCount: count(reviews.id),
			avgRating: avg(reviews.rating)
		})
		.from(reviews)
		.where(and(
			eq(reviews.productId, productId),
			sql`${reviews.content} != ''`
		));

	// Get product attachments - removed as table doesn't exist
	const attachments: any[] = [];

	// Get recent reviews
	const recentReviews = await db
		.select({
			id: reviews.id,
			rating: reviews.rating,
			content: reviews.content,
			createdAt: reviews.createdAt,
			reviewer: {
				id: users.id,
				name: users.name,
				image: users.image
			}
		})
		.from(reviews)
		.leftJoin(users, eq(reviews.userId, users.id))
		.where(and(
			eq(reviews.productId, productId),
			sql`${reviews.content} != ''`
		))
		.orderBy(sql`${reviews.createdAt} DESC`)
		.limit(5);

	// Transform data
	const transformedProduct = {
		...product,
		imageUrl: transformImageUrl(product.imageUrl),
		reviewCount: Number(reviewStats[0]?.reviewCount || 0),
		rating: reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating) : null,
		guide: product.guide
			? {
					...decryptUserFields(product.guide),
					image: transformImageUrl(product.guide.image)
				}
			: null,
		guideProfile: product.guideProfile
			? {
					...product.guideProfile,
					profileImageUrl: transformImageUrl(product.guideProfile.profileImageUrl)
				}
			: null,
		attachments: attachments.map(att => ({
			...att,
			fileUrl: transformImageUrl(att.fileUrl)
		})),
		reviews: recentReviews.map(review => ({
			...review,
			reviewer: review.reviewer ? decryptUserFields(review.reviewer) : null
		}))
	};

	return {
		product: transformedProduct,
		user: locals.user || null
	};
};
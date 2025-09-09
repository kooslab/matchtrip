import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products, destinations, countries, users, guideProfiles, reviews } from '$lib/server/db/schema';
import { eq, and, sql, count, avg } from 'drizzle-orm';
import { transformImageUrl } from '$lib/utils/imageUrl';

export const load: PageServerLoad = async ({ url, locals }) => {
	const destinationId = url.searchParams.get('destination');

	// Import decryption utility
	const { decryptUserFields } = await import('$lib/server/encryption');

	// If no destination selected, show destinations with products
	if (!destinationId) {
		// Get destinations that have active products
		const destinationsWithProducts = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				imageUrl: destinations.imageUrl,
				country: {
					id: countries.id,
					name: countries.name
				},
				productCount: count(products.id)
			})
			.from(destinations)
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.innerJoin(
				products,
				and(eq(products.destinationId, destinations.id), eq(products.status, 'active'))
			)
			.groupBy(destinations.id, countries.id, countries.name)
			.having(sql`${count(products.id)} > 0`)
			.orderBy(sql`${count(products.id)} DESC`);

		// Transform image URLs for destinations
		const transformedDestinations = destinationsWithProducts.map((dest) => ({
			...dest,
			imageUrl: transformImageUrl(dest.imageUrl)
		}));

		return {
			destinations: transformedDestinations,
			products: [],
			selectedDestination: null,
			user: locals.user
		};
	}

	// Get destination info if provided
	let selectedDestination = null;
	if (destinationId) {
		const destinationResult = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				country: {
					id: countries.id,
					name: countries.name
				}
			})
			.from(destinations)
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.where(eq(destinations.id, parseInt(destinationId)))
			.limit(1);

		selectedDestination = destinationResult[0] || null;
	}

	// Build query for products
	const conditions = [eq(products.status, 'active')];
	if (destinationId) {
		conditions.push(eq(products.destinationId, parseInt(destinationId)));
	}

	// Get products with guide information and review stats
	const productsResult = await db
		.select({
			id: products.id,
			title: products.title,
			description: products.description,
			price: products.price,
			currency: products.currency,
			duration: products.duration,
			imageUrl: products.imageUrl,
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
				profileImageUrl: guideProfiles.profileImageUrl
			}
		})
		.from(products)
		.leftJoin(destinations, eq(products.destinationId, destinations.id))
		.leftJoin(countries, eq(destinations.countryId, countries.id))
		.leftJoin(users, eq(products.guideId, users.id))
		.leftJoin(guideProfiles, eq(products.guideId, guideProfiles.userId))
		.where(and(...conditions))
		.orderBy(sql`${products.createdAt} DESC`);

	// Get review stats for each product
	const productIds = productsResult.map(p => p.id);
	const reviewStats = productIds.length > 0 ? await db
		.select({
			productId: reviews.productId,
			reviewCount: count(reviews.id),
			avgRating: avg(reviews.rating)
		})
		.from(reviews)
		.where(and(
			sql`${reviews.productId} IN ${sql`(${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`}`,
			sql`${reviews.content} != ''` // Only count reviews with actual content
		))
		.groupBy(reviews.productId) : [];

	// Create a map of review stats for quick lookup
	const reviewStatsMap = new Map(reviewStats.map(stat => [
		stat.productId, 
		{ 
			reviewCount: Number(stat.reviewCount), 
			rating: stat.avgRating ? Number(stat.avgRating) : null 
		}
	]));

	// Transform image URLs for products and decrypt guide data
	const productsList = productsResult.map((product) => {
		const stats = reviewStatsMap.get(product.id) || { reviewCount: 0, rating: null };
		return {
			...product,
			imageUrl: transformImageUrl(product.imageUrl),
			reviewCount: stats.reviewCount,
			rating: stats.rating,
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
				: null
		};
	});

	return {
		destinations: [],
		products: productsList,
		selectedDestination,
		user: locals.user
	};
};

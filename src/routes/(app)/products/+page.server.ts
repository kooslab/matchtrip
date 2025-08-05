import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products, destinations, countries, users, guideProfiles } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, locals }) => {
	const destinationId = url.searchParams.get('destination');
	
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
	
	// Get products with guide information
	const productsList = await db
		.select({
			id: products.id,
			title: products.title,
			description: products.description,
			price: products.price,
			currency: products.currency,
			imageUrl: products.imageUrl,
			rating: products.rating,
			reviewCount: products.reviewCount,
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
	
	return {
		products: productsList,
		selectedDestination,
		user: locals.user
	};
};
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { products, destinations, users, guideProfiles } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/');
	}

	// Fetch guide's products with full details
	const myProducts = await db
		.select({
			id: products.id,
			title: products.title,
			description: products.description,
			price: products.price,
			currency: products.currency,
			status: products.status,
			duration: products.duration,
			languages: products.languages,
			imageUrl: products.imageUrl,
			rating: products.rating,
			reviewCount: products.reviewCount,
			createdAt: products.createdAt,
			destination: {
				id: destinations.id,
				city: destinations.city
			},
			guide: {
				id: users.id,
				name: users.name,
				image: users.image
			},
			guideProfile: {
				username: guideProfiles.username,
				profileImageUrl: guideProfiles.profileImageUrl,
				currentLocation: guideProfiles.currentLocation,
				languages: guideProfiles.languages,
				isVerified: guideProfiles.isVerified
			}
		})
		.from(products)
		.leftJoin(destinations, eq(products.destinationId, destinations.id))
		.leftJoin(users, eq(products.guideId, users.id))
		.leftJoin(guideProfiles, eq(products.guideId, guideProfiles.userId))
		.where(eq(products.guideId, userId))
		.orderBy(desc(products.createdAt));

	return {
		myProducts,
		user: locals.user
	};
};
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, guideProfiles, products, destinations } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';

export const load: PageServerLoad = async ({ locals }) => {
	// You must have user info in locals (e.g., from your auth system)
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/');
	}

	// Fetch user info
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)
		.then((rows) => rows[0]);
	if (!user) {
		return { user: null, userRole: null, userName: null, guideProfile: null, myProducts: [] };
	}

	// Fetch guide profile (if exists)
	const guideProfile = await db
		.select()
		.from(guideProfiles)
		.where(eq(guideProfiles.userId, userId))
		.limit(1)
		.then((rows) => rows[0]);

	// Fetch guide's products
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
			}
		})
		.from(products)
		.leftJoin(destinations, eq(products.destinationId, destinations.id))
		.where(eq(products.guideId, userId))
		.orderBy(desc(products.createdAt));

	// Decrypt user fields before sending to client
	const decryptedUser = decryptUserFields(user);

	return {
		user: decryptedUser,
		userRole: decryptedUser.role,
		userName: decryptedUser.name,
		guideProfile,
		myProducts
	};
};

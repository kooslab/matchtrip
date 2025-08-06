import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { products, users, guideProfiles, destinations, countries, fileUploads } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// UUID validation regex
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: RequestHandler = async ({ params }) => {
	const productId = params.id;
	
	if (!productId || !uuidRegex.test(productId)) {
		return json({ error: 'Invalid product ID' }, { status: 400 });
	}

	try {
		// Fetch product with all related data
		const productData = await db
			.select({
				id: products.id,
				title: products.title,
				description: products.description,
				price: products.price,
				currency: products.currency,
				status: products.status,
				duration: products.duration,
				languages: products.languages,
				fileIds: products.fileIds,
				imageUrl: products.imageUrl,
				rating: products.rating,
				reviewCount: products.reviewCount,
				createdAt: products.createdAt,
				guide: {
					id: users.id,
					name: users.name,
					email: users.email,
					image: users.image
				},
				guideProfile: {
					username: guideProfiles.username,
					profileImageUrl: guideProfiles.profileImageUrl,
					currentLocation: guideProfiles.currentLocation,
					guideAreas: guideProfiles.guideAreas,
					activityAreas: guideProfiles.activityAreas,
					experience: guideProfiles.experience,
					languages: guideProfiles.languages,
					introduction: guideProfiles.introduction,
					isVerified: guideProfiles.isVerified
				},
				destination: {
					id: destinations.id,
					city: destinations.city,
					countryId: destinations.countryId
				}
			})
			.from(products)
			.leftJoin(users, eq(products.guideId, users.id))
			.leftJoin(guideProfiles, eq(products.guideId, guideProfiles.userId))
			.leftJoin(destinations, eq(products.destinationId, destinations.id))
			.where(eq(products.id, productId))
			.limit(1);

		if (!productData || productData.length === 0) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		const product = productData[0];

		// Fetch country information if destination exists
		let country = null;
		if (product.destination?.countryId) {
			const countryData = await db
				.select()
				.from(countries)
				.where(eq(countries.id, product.destination.countryId))
				.limit(1);
			
			if (countryData.length > 0) {
				country = countryData[0];
			}
		}

		// Fetch file attachments if fileIds exist
		let attachments: any[] = [];
		if (product.fileIds && product.fileIds.length > 0) {
			// Filter out any null or invalid UUIDs
			const validFileIds = product.fileIds.filter(id => id && id !== 'NULL' && uuidRegex.test(id));
			
			if (validFileIds.length > 0) {
				attachments = await db
					.select({
						id: fileUploads.id,
						filename: fileUploads.filename,
						originalName: fileUploads.originalName,
						fileType: fileUploads.fileType,
						fileSize: fileUploads.fileSize,
						url: fileUploads.url
					})
					.from(fileUploads)
					.where(inArray(fileUploads.id, validFileIds));
			}
		}

		return json({
			...product,
			destination: product.destination ? {
				...product.destination,
				country
			} : null,
			attachments
		});
	} catch (error) {
		console.error('Error fetching product:', error);
		return json({ error: 'Failed to fetch product' }, { status: 500 });
	}
};
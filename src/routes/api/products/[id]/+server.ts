import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { products, users, guideProfiles, destinations, countries, fileUploads, productConversations, payments } from '$lib/server/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
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

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const productId = params.id;
	const userId = locals.user?.id;
	
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	if (!productId || !uuidRegex.test(productId)) {
		return json({ error: 'Invalid product ID' }, { status: 400 });
	}

	try {
		// Check if product exists and belongs to current user
		const existingProduct = await db
			.select({ id: products.id, guideId: products.guideId })
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (!existingProduct.length) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		if (existingProduct[0].guideId !== userId) {
			return json({ error: 'Not authorized to update this product' }, { status: 403 });
		}

		// Check restrictions before allowing update
		const [conversations, completedPayments] = await Promise.all([
			db.select({ id: productConversations.id })
				.from(productConversations)
				.where(
					and(
						eq(productConversations.productId, productId),
						eq(productConversations.status, 'active')
					)
				),
			db.select({ id: payments.id })
				.from(payments)
				.where(
					and(
						eq(payments.productId, productId),
						eq(payments.status, 'completed')
					)
				)
		]);

		const isRestricted = conversations.length > 0 || completedPayments.length > 0;
		if (isRestricted) {
			return json({ 
				error: 'Product cannot be modified',
				reason: completedPayments.length > 0 
					? 'Product has completed payments'
					: 'Product has active conversations'
			}, { status: 409 });
		}

		// Parse and validate request body
		const updateData = await request.json();
		const { title, description, price, destinationId, duration, languages, fileIds } = updateData;

		// Validate required fields
		if (!title || !description || !price || !destinationId) {
			return json({ error: 'Missing required fields: title, description, price, destinationId' }, { status: 400 });
		}

		// Validate price is positive integer
		if (typeof price !== 'number' || price <= 0) {
			return json({ error: 'Price must be a positive number' }, { status: 400 });
		}

		// Validate destination exists
		const destination = await db
			.select({ id: destinations.id })
			.from(destinations)
			.where(eq(destinations.id, destinationId))
			.limit(1);

		if (!destination.length) {
			return json({ error: 'Invalid destination ID' }, { status: 400 });
		}

		// Update the product
		const updatedProduct = await db
			.update(products)
			.set({
				title: title.trim(),
				description: description.trim(),
				price: Math.floor(price),
				destinationId,
				duration: duration || null,
				languages: languages || [],
				fileIds: fileIds || [],
				updatedAt: new Date()
			})
			.where(eq(products.id, productId))
			.returning({
				id: products.id,
				title: products.title,
				description: products.description,
				price: products.price,
				status: products.status,
				updatedAt: products.updatedAt
			});

		return json({
			success: true,
			product: updatedProduct[0]
		});

	} catch (error) {
		console.error('Error updating product:', error);
		return json({ error: 'Failed to update product' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const productId = params.id;
	const userId = locals.user?.id;
	
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	if (!productId || !uuidRegex.test(productId)) {
		return json({ error: 'Invalid product ID' }, { status: 400 });
	}

	try {
		// Check if product exists and belongs to current user
		const existingProduct = await db
			.select({ id: products.id, guideId: products.guideId })
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (!existingProduct.length) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		if (existingProduct[0].guideId !== userId) {
			return json({ error: 'Not authorized to delete this product' }, { status: 403 });
		}

		// Check restrictions before allowing deletion
		const [conversations, completedPayments] = await Promise.all([
			db.select({ id: productConversations.id })
				.from(productConversations)
				.where(eq(productConversations.productId, productId)),
			db.select({ id: payments.id })
				.from(payments)
				.where(eq(payments.productId, productId))
		]);

		const isRestricted = conversations.length > 0 || completedPayments.length > 0;
		if (isRestricted) {
			return json({ 
				error: 'Product cannot be deleted',
				reason: completedPayments.length > 0 
					? 'Product has payment history'
					: 'Product has conversation history'
			}, { status: 409 });
		}

		// Delete the product
		await db.delete(products).where(eq(products.id, productId));

		return json({ success: true, message: 'Product deleted successfully' });

	} catch (error) {
		console.error('Error deleting product:', error);
		return json({ error: 'Failed to delete product' }, { status: 500 });
	}
};
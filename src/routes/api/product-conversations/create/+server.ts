import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { productConversations, products, productOffers } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;

	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { productId, guideId } = await request.json();

		if (!productId || !guideId) {
			return json({ error: 'Product ID and Guide ID are required' }, { status: 400 });
		}

		// Verify the product exists and belongs to the guide
		const product = await db.select().from(products).where(eq(products.id, productId)).limit(1);

		if (!product.length) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		if (product[0].guideId !== guideId) {
			return json({ error: 'Invalid guide for this product' }, { status: 400 });
		}

		// Check if there's an existing conversation for this product and user
		const existingConversation = await db
			.select()
			.from(productConversations)
			.where(
				and(
					eq(productConversations.productId, productId),
					eq(productConversations.travelerId, userId)
				)
			)
			.limit(1);

		let shouldCreateNew = false;

		// If there's an existing conversation, check if it has an accepted offer
		if (existingConversation.length > 0) {
			const conversationId = existingConversation[0].id;

			// Check if this conversation has any accepted offers
			const acceptedOffer = await db
				.select({
					id: productOffers.id,
					status: productOffers.status
				})
				.from(productOffers)
				.where(
					and(
						eq(productOffers.conversationId, conversationId),
						eq(productOffers.status, 'accepted')
					)
				)
				.limit(1);

			console.log('Existing conversation found:', conversationId);
			console.log('Accepted offer found:', acceptedOffer.length > 0);

			// If there's an accepted offer (meaning it was paid for), create a new conversation
			if (acceptedOffer.length > 0) {
				shouldCreateNew = true;
				console.log('Found accepted offer, will create new conversation');
			} else {
				// No accepted offer, return the existing conversation
				return json({
					conversationId: existingConversation[0].id,
					isNew: false
				});
			}
		}

		// Create new conversation
		const newConversation = await db
			.insert(productConversations)
			.values({
				productId,
				travelerId: userId,
				guideId,
				status: 'active'
			})
			.returning({ id: productConversations.id });

		return json({
			conversationId: newConversation[0].id,
			isNew: true
		});
	} catch (error) {
		console.error('Error creating product conversation:', error);
		return json({ error: 'Failed to create conversation' }, { status: 500 });
	}
};

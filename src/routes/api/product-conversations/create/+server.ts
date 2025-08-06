import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { productConversations, products } from '$lib/server/db/schema';
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
		const product = await db
			.select()
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);
		
		if (!product.length) {
			return json({ error: 'Product not found' }, { status: 404 });
		}
		
		if (product[0].guideId !== guideId) {
			return json({ error: 'Invalid guide for this product' }, { status: 400 });
		}
		
		// Check if conversation already exists
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
		
		if (existingConversation.length > 0) {
			// Return existing conversation
			return json({ 
				conversationId: existingConversation[0].id,
				isNew: false 
			});
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
import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { products, productConversations, payments } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: RequestHandler = async ({ params, locals }) => {
	const productId = params.id;
	const userId = locals.user?.id;

	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!productId || !uuidRegex.test(productId)) {
		return json({ error: 'Invalid product ID' }, { status: 400 });
	}

	try {
		// Check if product exists and belongs to current user (guide)
		const product = await db
			.select({ id: products.id, guideId: products.guideId })
			.from(products)
			.where(eq(products.id, productId))
			.limit(1);

		if (!product.length) {
			return json({ error: 'Product not found' }, { status: 404 });
		}

		if (product[0].guideId !== userId) {
			return json({ error: 'Not authorized to access this product' }, { status: 403 });
		}

		// Check for active conversations
		const conversations = await db
			.select({ id: productConversations.id })
			.from(productConversations)
			.where(
				and(
					eq(productConversations.productId, productId),
					eq(productConversations.status, 'active')
				)
			);

		// Check for completed payments
		const completedPayments = await db
			.select({ id: payments.id })
			.from(payments)
			.where(and(eq(payments.productId, productId), eq(payments.status, 'completed')));

		const hasActiveConversations = conversations.length > 0;
		const hasCompletedPayments = completedPayments.length > 0;
		// Only restrict deletion/editing if there are completed payments
		const isRestricted = hasCompletedPayments;

		return json({
			canEdit: !isRestricted,  // Allow editing even with conversations
			canDelete: !isRestricted && !hasActiveConversations,  // Prevent deletion with conversations or payments
			restrictions: {
				hasActiveConversations,
				hasCompletedPayments,
				conversationCount: conversations.length,
				completedPaymentCount: completedPayments.length
			},
			reason: isRestricted
				? 'Product has completed payments and cannot be modified'
				: hasActiveConversations
				? 'Product has active conversations and cannot be deleted'
				: null
		});
	} catch (error) {
		console.error('Error checking product restrictions:', error);
		return json({ error: 'Failed to check restrictions' }, { status: 500 });
	}
};;

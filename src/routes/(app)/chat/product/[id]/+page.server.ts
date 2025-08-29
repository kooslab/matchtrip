import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	productConversations,
	productMessages,
	products,
	users,
	destinations,
	productOffers
} from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { transformImageUrl } from '$lib/utils/imageUrl';

export const load: PageServerLoad = async ({ params, locals }) => {
	const conversationId = params.id;
	const userId = locals.user?.id;

	if (!userId) {
		throw redirect(302, '/login');
	}

	// Handle invalid conversation ID (e.g., 'undefined' from old payment sessions)
	if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
		console.warn('Invalid conversation ID attempted:', conversationId);
		throw redirect(302, '/products');
	}

	// Import decryption utility
	const { decryptUserFields } = await import('$lib/server/encryption');

	// Fetch conversation details
	const conversation = await db
		.select({
			id: productConversations.id,
			productId: productConversations.productId,
			travelerId: productConversations.travelerId,
			guideId: productConversations.guideId,
			status: productConversations.status,
			travelerLastReadAt: productConversations.travelerLastReadAt,
			guideLastReadAt: productConversations.guideLastReadAt
		})
		.from(productConversations)
		.where(eq(productConversations.id, conversationId))
		.limit(1);

	if (!conversation.length) {
		throw error(404, 'Conversation not found');
	}

	const conv = conversation[0];

	// Check if user is part of this conversation
	if (conv.travelerId !== userId && conv.guideId !== userId) {
		throw error(403, 'Access denied');
	}

	// Determine user role in this conversation
	const userRole = conv.travelerId === userId ? 'traveler' : 'guide';

	// Fetch product details
	const product = await db
		.select({
			id: products.id,
			title: products.title,
			description: products.description,
			price: products.price,
			currency: products.currency,
			duration: products.duration,
			languages: products.languages,
			imageUrl: products.imageUrl,
			destination: {
				id: destinations.id,
				city: destinations.city
			}
		})
		.from(products)
		.leftJoin(destinations, eq(products.destinationId, destinations.id))
		.where(eq(products.id, conv.productId))
		.limit(1);

	if (!product.length) {
		throw error(404, 'Product not found');
	}

	// Fetch messages with product offer data
	const messages = await db
		.select({
			id: productMessages.id,
			senderId: productMessages.senderId,
			content: productMessages.content,
			messageType: productMessages.messageType,
			metadata: productMessages.metadata,
			isEdited: productMessages.isEdited,
			editedAt: productMessages.editedAt,
			isDeleted: productMessages.isDeleted,
			createdAt: productMessages.createdAt,
			sender: {
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				image: users.image
			},
			productOfferId: productOffers.id
		})
		.from(productMessages)
		.leftJoin(users, eq(productMessages.senderId, users.id))
		.leftJoin(productOffers, eq(productMessages.id, productOffers.messageId))
		.where(eq(productMessages.conversationId, conversationId))
		.orderBy(productMessages.createdAt);

	// Decrypt sender information in messages and transform image URLs
	const decryptedMessages = messages.map((msg) => ({
		...msg,
		sender: msg.sender
			? {
					...decryptUserFields(msg.sender),
					image: transformImageUrl(msg.sender.image)
				}
			: null
	}));

	// Fetch other user's info
	const otherUserId = userRole === 'traveler' ? conv.guideId : conv.travelerId;
	const otherUser = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			image: users.image
		})
		.from(users)
		.where(eq(users.id, otherUserId))
		.limit(1);

	// Decrypt other user's data and transform image URL
	const decryptedOtherUser = otherUser[0]
		? {
				...decryptUserFields(otherUser[0]),
				image: transformImageUrl(otherUser[0].image)
			}
		: null;

	// Update last read timestamp
	if (userRole === 'traveler') {
		await db
			.update(productConversations)
			.set({ travelerLastReadAt: new Date() })
			.where(eq(productConversations.id, conversationId));
	} else {
		await db
			.update(productConversations)
			.set({ guideLastReadAt: new Date() })
			.where(eq(productConversations.id, conversationId));
	}

	return {
		conversation: conv,
		product: product[0],
		messages: decryptedMessages,
		otherUser: decryptedOtherUser,
		userRole,
		currentUserId: userId
	};
};

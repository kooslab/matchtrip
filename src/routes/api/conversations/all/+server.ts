import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	conversations,
	productConversations,
	messages,
	productMessages,
	offers,
	products,
	users
} from '$lib/server/db/schema';
import { eq, or, desc, and, gt, ne, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { decryptUserFields } from '$lib/server/encryption';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;

	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Fetch trip conversations
		const tripConversations = await db
			.select({
				id: conversations.id,
				status: conversations.status,
				lastMessageAt: conversations.lastMessageAt,
				travelerLastReadAt: conversations.travelerLastReadAt,
				guideLastReadAt: conversations.guideLastReadAt,
				travelerId: conversations.travelerId,
				guideId: conversations.guideId,
				offerId: conversations.offerId,
				offerId_: offers.id,
				offerTitle: offers.title,
				offerPrice: offers.price,
				offerStatus: offers.status
			})
			.from(conversations)
			.leftJoin(offers, eq(conversations.offerId, offers.id))
			.where(or(eq(conversations.travelerId, userId), eq(conversations.guideId, userId)));

		// Fetch product conversations
		const productConvs = await db
			.select({
				id: productConversations.id,
				status: productConversations.status,
				lastMessageAt: productConversations.lastMessageAt,
				travelerLastReadAt: productConversations.travelerLastReadAt,
				guideLastReadAt: productConversations.guideLastReadAt,
				travelerId: productConversations.travelerId,
				guideId: productConversations.guideId,
				productId: productConversations.productId,
				productId_: products.id,
				productTitle: products.title,
				productPrice: products.price,
				productImageUrl: products.imageUrl
			})
			.from(productConversations)
			.leftJoin(products, eq(productConversations.productId, products.id))
			.where(
				or(eq(productConversations.travelerId, userId), eq(productConversations.guideId, userId))
			);

		// Process trip conversations
		const processedTripConvs = await Promise.all(
			tripConversations.map(async (conv) => {
				// Get other user
				const otherUserId = conv.travelerId === userId ? conv.guideId : conv.travelerId;
				const [otherUser] = await db
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

				// Get last message
				const [lastMessage] = await db
					.select({
						content: messages.content,
						createdAt: messages.createdAt,
						senderId: messages.senderId
					})
					.from(messages)
					.where(eq(messages.conversationId, conv.id))
					.orderBy(desc(messages.createdAt))
					.limit(1);

				// Calculate unread count
				const isUserTraveler = conv.travelerId === userId;
				const lastReadAt = isUserTraveler ? conv.travelerLastReadAt : conv.guideLastReadAt;

				let unreadCount = 0;
				if (lastMessage && lastReadAt) {
					const unreadMessages = await db
						.select({ id: messages.id })
						.from(messages)
						.where(
							and(
								eq(messages.conversationId, conv.id),
								gt(messages.createdAt, lastReadAt),
								ne(messages.senderId, userId)
							)
						);
					unreadCount = unreadMessages.length;
				}

				return {
					id: conv.id,
					type: 'trip' as const,
					status: conv.status,
					lastMessageAt: conv.lastMessageAt,
					lastMessageContent: lastMessage?.content || null,
					unreadCount,
					hasUnread: unreadCount > 0,
					otherUser: otherUser ? decryptUserFields(otherUser) : null,
					title: conv.offerTitle || 'Trip Chat',
					subtitle: `Offer: ${conv.offerStatus || 'N/A'}`,
					offer: conv.offerId_
						? {
								id: conv.offerId_,
								title: conv.offerTitle,
								price: conv.offerPrice,
								status: conv.offerStatus
							}
						: null
				};
			})
		);

		// Process product conversations
		const processedProductConvs = await Promise.all(
			productConvs.map(async (conv) => {
				// Get other user
				const otherUserId = conv.travelerId === userId ? conv.guideId : conv.travelerId;
				const [otherUser] = await db
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

				// Get last message
				const [lastMessage] = await db
					.select({
						content: productMessages.content,
						createdAt: productMessages.createdAt,
						senderId: productMessages.senderId,
						messageType: productMessages.messageType
					})
					.from(productMessages)
					.where(eq(productMessages.conversationId, conv.id))
					.orderBy(desc(productMessages.createdAt))
					.limit(1);

				// Calculate unread count
				const isUserTraveler = conv.travelerId === userId;
				const lastReadAt = isUserTraveler ? conv.travelerLastReadAt : conv.guideLastReadAt;

				let unreadCount = 0;
				if (lastMessage && lastReadAt) {
					const unreadMessages = await db
						.select({ id: productMessages.id })
						.from(productMessages)
						.where(
							and(
								eq(productMessages.conversationId, conv.id),
								gt(productMessages.createdAt, lastReadAt),
								ne(productMessages.senderId, userId)
							)
						);
					unreadCount = unreadMessages.length;
				}

				// Format last message content based on type
				let lastMessageContent = lastMessage?.content;
				if (lastMessage?.messageType === 'image') {
					lastMessageContent = '📷 이미지';
				} else if (lastMessage?.messageType === 'file') {
					lastMessageContent = '📎 파일';
				} else if (lastMessage?.messageType === 'offer') {
					lastMessageContent = '💰 제안';
				}

				return {
					id: conv.id,
					type: 'product' as const,
					status: conv.status,
					lastMessageAt: conv.lastMessageAt,
					lastMessageContent,
					unreadCount,
					hasUnread: unreadCount > 0,
					otherUser: otherUser ? decryptUserFields(otherUser) : null,
					title: conv.productTitle || 'Product Chat',
					subtitle: 'Product Inquiry',
					productImage: conv.productImageUrl
				};
			})
		);

		// Combine and sort by last message time
		const allConversations = [...processedTripConvs, ...processedProductConvs].sort((a, b) => {
			const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
			const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
			return bTime - aTime;
		});

		return json({ conversations: allConversations });
	} catch (error) {
		console.error('Error fetching conversations:', error);
		return json({ error: 'Failed to fetch conversations' }, { status: 500 });
	}
};

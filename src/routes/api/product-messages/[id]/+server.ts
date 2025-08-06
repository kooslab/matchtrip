import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { productMessages, productConversations, productOffers, users } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET messages for a conversation
export const GET: RequestHandler = async ({ params, locals }) => {
	const conversationId = params.id;
	const userId = locals.user?.id;
	
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	// Verify user is part of this conversation
	const conversation = await db
		.select()
		.from(productConversations)
		.where(eq(productConversations.id, conversationId))
		.limit(1);
	
	if (!conversation.length) {
		return json({ error: 'Conversation not found' }, { status: 404 });
	}
	
	if (conversation[0].travelerId !== userId && conversation[0].guideId !== userId) {
		return json({ error: 'Access denied' }, { status: 403 });
	}
	
	// Fetch messages
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
			}
		})
		.from(productMessages)
		.leftJoin(users, eq(productMessages.senderId, users.id))
		.where(eq(productMessages.conversationId, conversationId))
		.orderBy(productMessages.createdAt);
	
	return json(messages);
};

// POST new message
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const conversationId = params.id;
	const userId = locals.user?.id;
	
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	// Verify user is part of this conversation
	const conversation = await db
		.select()
		.from(productConversations)
		.where(eq(productConversations.id, conversationId))
		.limit(1);
	
	if (!conversation.length) {
		return json({ error: 'Conversation not found' }, { status: 404 });
	}
	
	const conv = conversation[0];
	if (conv.travelerId !== userId && conv.guideId !== userId) {
		return json({ error: 'Access denied' }, { status: 403 });
	}
	
	const { content, messageType, metadata } = await request.json();
	
	// Insert message
	const [newMessage] = await db
		.insert(productMessages)
		.values({
			conversationId,
			senderId: userId,
			content,
			messageType: messageType || 'text',
			metadata: metadata || null
		})
		.returning();
	
	// If it's an offer message, create an offer record
	if (messageType === 'offer' && metadata) {
		await db
			.insert(productOffers)
			.values({
				messageId: newMessage.id,
				conversationId,
				guideId: userId,
				price: metadata.price,
				duration: metadata.duration,
				status: 'pending'
			});
	}
	
	// Update conversation's last message timestamp
	await db
		.update(productConversations)
		.set({ 
			lastMessageAt: new Date(),
			updatedAt: new Date()
		})
		.where(eq(productConversations.id, conversationId));
	
	// Return the message with sender info
	const messageWithSender = await db
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
			}
		})
		.from(productMessages)
		.leftJoin(users, eq(productMessages.senderId, users.id))
		.where(eq(productMessages.id, newMessage.id))
		.limit(1);
	
	return json(messageWithSender[0]);
};
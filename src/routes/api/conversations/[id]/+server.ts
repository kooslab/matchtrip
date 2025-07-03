import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { conversations, messages, users, offers, trips, destinations } from '$lib/server/db/schema';
import { eq, and, or, asc } from 'drizzle-orm';

// GET /api/conversations/[id] - Get conversation details with messages
export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		console.log('No session found in conversation GET');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversationId = params.id;
	console.log('Fetching conversation:', conversationId, 'for user:', session.user?.id);

	try {
		// Get conversation details
		console.log('Querying conversation with ID:', conversationId);
		const conversation = await db
			.select()
			.from(conversations)
			.where(eq(conversations.id, conversationId))
			.limit(1);

		console.log('Conversation query result:', conversation);

		if (!conversation.length) {
			console.log('No conversation found');
			return json({ error: 'Conversation not found' }, { status: 404 });
		}

		const conv = conversation[0];
		console.log('Conversation found:', conv);

		// Check if user is part of this conversation
		if (conv.travelerId !== session.user.id && conv.guideId !== session.user.id) {
			return json({ error: 'Not authorized' }, { status: 403 });
		}

		// Get all messages in this conversation
		const conversationMessages = await db
			.select({
				id: messages.id,
				content: messages.content,
				senderId: messages.senderId,
				isEdited: messages.isEdited,
				editedAt: messages.editedAt,
				isDeleted: messages.isDeleted,
				createdAt: messages.createdAt,
				sender: {
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role,
					image: users.image
				}
			})
			.from(messages)
			.leftJoin(users, eq(messages.senderId, users.id))
			.where(eq(messages.conversationId, conversationId))
			.orderBy(asc(messages.createdAt));

		// Update last read timestamp
		const isGuide = conv.guideId === session.user.id;
		await db
			.update(conversations)
			.set({
				[isGuide ? 'guideLastReadAt' : 'travelerLastReadAt']: new Date(),
				updatedAt: new Date()
			})
			.where(eq(conversations.id, conversationId));

		// Get offer details
		const offerDetails = await db
			.select({
				id: offers.id,
				title: offers.title,
				price: offers.price,
				status: offers.status,
				tripId: offers.tripId,
				destination: {
					city: destinations.city,
					country: destinations.country
				},
				trip: {
					id: trips.id,
					startDate: trips.startDate,
					endDate: trips.endDate
				}
			})
			.from(offers)
			.leftJoin(trips, eq(offers.tripId, trips.id))
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.where(eq(offers.id, conv.offerId))
			.limit(1);

		console.log('Returning conversation with', conversationMessages.length, 'messages');
		return json({
			conversation: conv,
			messages: conversationMessages,
			offer: offerDetails[0] || null
		});
	} catch (error) {
		console.error('Error fetching conversation:', error);
		console.error('Error details:', error instanceof Error ? error.message : String(error));
		return json({ error: 'Failed to fetch conversation' }, { status: 500 });
	}
};

// POST /api/conversations/[id] - Send a message in conversation
export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversationId = params.id;

	try {
		const { content } = await request.json();

		if (!content || !content.trim()) {
			return json({ error: 'Message content is required' }, { status: 400 });
		}

		// Get conversation to verify access
		const conversation = await db
			.select()
			.from(conversations)
			.where(eq(conversations.id, conversationId))
			.limit(1);

		if (!conversation.length) {
			return json({ error: 'Conversation not found' }, { status: 404 });
		}

		const conv = conversation[0];

		// Check if user is part of this conversation
		if (conv.travelerId !== session.user.id && conv.guideId !== session.user.id) {
			return json({ error: 'Not authorized' }, { status: 403 });
		}

		// Check if conversation is active
		if (conv.status !== 'active') {
			return json({ error: 'Conversation is not active' }, { status: 400 });
		}

		// Create the message
		const newMessage = await db
			.insert(messages)
			.values({
				conversationId,
				senderId: session.user.id,
				content: content.trim()
			})
			.returning();

		// Update conversation last message timestamp
		await db
			.update(conversations)
			.set({
				lastMessageAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(conversations.id, conversationId));

		// Get sender info
		const sender = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				image: users.image
			})
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		return json({
			message: {
				...newMessage[0],
				sender: sender[0]
			}
		});
	} catch (error) {
		console.error('Error sending message:', error);
		return json({ error: 'Failed to send message' }, { status: 500 });
	}
};

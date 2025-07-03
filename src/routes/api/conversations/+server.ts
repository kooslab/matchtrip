import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { conversations, messages, offers, users } from '$lib/server/db/schema';
import { eq, and, or, desc, gt, sql } from 'drizzle-orm';

// GET /api/conversations - Get all conversations for the current user
export const GET: RequestHandler = async ({ locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get conversations where user is either traveler or guide
		const userConversations = await db
			.select({
				id: conversations.id,
				offerId: conversations.offerId,
				travelerId: conversations.travelerId,
				guideId: conversations.guideId,
				status: conversations.status,
				lastMessageAt: conversations.lastMessageAt,
				travelerLastReadAt: conversations.travelerLastReadAt,
				guideLastReadAt: conversations.guideLastReadAt,
				createdAt: conversations.createdAt,
				// Get the other user's info
				otherUser: {
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role,
					image: users.image
				},
				// Get offer details
				offer: {
					id: offers.id,
					title: offers.title,
					price: offers.price,
					status: offers.status
				}
			})
			.from(conversations)
			.leftJoin(
				users,
				or(
					and(eq(conversations.travelerId, session.user.id), eq(users.id, conversations.guideId)),
					and(eq(conversations.guideId, session.user.id), eq(users.id, conversations.travelerId))
				)
			)
			.leftJoin(offers, eq(conversations.offerId, offers.id))
			.where(
				or(
					eq(conversations.travelerId, session.user.id),
					eq(conversations.guideId, session.user.id)
				)
			)
			.orderBy(desc(conversations.lastMessageAt));

		// Get unread count for each conversation
		const conversationsWithUnread = await Promise.all(
			userConversations.map(async (conv) => {
				const isGuide = conv.guideId === session.user.id;
				const lastReadAt = isGuide ? conv.guideLastReadAt : conv.travelerLastReadAt;

				const unreadConditions = [eq(messages.conversationId, conv.id)];
				if (lastReadAt) {
					unreadConditions.push(gt(messages.createdAt, lastReadAt));
				}

				const unreadResult = await db
					.select({ count: sql<number>`count(*)` })
					.from(messages)
					.where(and(...unreadConditions));

				return {
					...conv,
					unreadCount: unreadResult[0]?.count || 0
				};
			})
		);

		return json({ conversations: conversationsWithUnread });
	} catch (error) {
		console.error('Error fetching conversations:', error);
		return json({ error: 'Failed to fetch conversations' }, { status: 500 });
	}
};

// POST /api/conversations - Create a new conversation
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { offerId } = await request.json();

		// Get the offer details
		const offer = await db.select().from(offers).where(eq(offers.id, offerId)).limit(1);

		if (!offer.length) {
			return json({ error: 'Offer not found' }, { status: 404 });
		}

		const offerData = offer[0];

		// Check if user is either the guide or traveler for this offer
		if (offerData.guideId !== session.user.id && offerData.travelerId !== session.user.id) {
			return json({ error: 'Not authorized for this offer' }, { status: 403 });
		}

		// Check if conversation already exists
		const existingConversation = await db
			.select()
			.from(conversations)
			.where(eq(conversations.offerId, offerId))
			.limit(1);

		if (existingConversation.length) {
			return json({ conversation: existingConversation[0] });
		}

		// Create new conversation
		const newConversation = await db
			.insert(conversations)
			.values({
				offerId,
				travelerId: offerData.travelerId,
				guideId: offerData.guideId,
				status: 'active'
			})
			.returning();

		return json({ conversation: newConversation[0] });
	} catch (error) {
		console.error('Error creating conversation:', error);
		return json({ error: 'Failed to create conversation' }, { status: 500 });
	}
};

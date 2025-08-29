import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import {
	conversations,
	messages,
	users,
	offers,
	trips,
	destinations,
	countries,
	payments
} from '$lib/server/db/schema';
import { eq, and, or, asc, sql } from 'drizzle-orm';
import { notificationService } from '$lib/server/services/notificationService';
import { decryptUserFields, decrypt } from '$lib/server/encryption';
import { transformImageUrl } from '$lib/utils/imageUrl';

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
				messageType: messages.messageType,
				metadata: messages.metadata,
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

		// Decrypt user data in messages
		const decryptedMessages = conversationMessages.map((msg) => ({
			...msg,
			sender: msg.sender
				? {
						...decryptUserFields(msg.sender),
						image: transformImageUrl(msg.sender.image)
					}
				: null
		}));

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
					country: countries.name
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
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.where(eq(offers.id, conv.offerId))
			.limit(1);

		// Check chat permissions for guides
		let canSendMessage = true;

		if (isGuide) {
			// Check if traveler has sent any messages
			const travelerMessages = await db
				.select({ count: sql<number>`count(*)` })
				.from(messages)
				.where(
					and(eq(messages.conversationId, conversationId), eq(messages.senderId, conv.travelerId))
				);

			const hasTravelerMessages = travelerMessages[0]?.count > 0;

			// Check if payment is completed for this offer
			const completedPayments = await db
				.select({ count: sql<number>`count(*)` })
				.from(payments)
				.where(and(eq(payments.offerId, conv.offerId), eq(payments.status, 'completed')));

			const hasCompletedPayment = completedPayments[0]?.count > 0;

			// Guide can only send messages if traveler has messaged or payment is completed
			canSendMessage = hasTravelerMessages || hasCompletedPayment;
		}

		console.log('Returning conversation with', decryptedMessages.length, 'messages');
		return json({
			conversation: conv,
			messages: decryptedMessages,
			offer: offerDetails[0] || null,
			canSendMessage
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

		// Determine if the user is a guide
		const isGuide = conv.guideId === session.user.id;

		// If the sender is a guide, check chat permissions
		if (isGuide) {
			// Check if traveler has sent any messages
			const travelerMessages = await db
				.select({ count: sql<number>`count(*)` })
				.from(messages)
				.where(
					and(eq(messages.conversationId, conversationId), eq(messages.senderId, conv.travelerId))
				);

			const hasTravelerMessages = travelerMessages[0]?.count > 0;

			// Check if payment is completed for this offer
			const completedPayments = await db
				.select({ count: sql<number>`count(*)` })
				.from(payments)
				.where(and(eq(payments.offerId, conv.offerId), eq(payments.status, 'completed')));

			const hasCompletedPayment = completedPayments[0]?.count > 0;

			// Guide can only send messages if:
			// 1. Traveler has already sent a message, OR
			// 2. Payment has been completed
			if (!hasTravelerMessages && !hasCompletedPayment) {
				return json(
					{ error: '고객이 먼저 메시지를 보내거나 결제가 완료된 후에 채팅이 가능합니다.' },
					{ status: 403 }
				);
			}
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
				image: users.image,
				phone: users.phone
			})
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);

		// Send chat notifications
		try {
			// Get recipient info
			const recipientId = isGuide ? conv.travelerId : conv.guideId;
			const recipient = await db
				.select({ name: users.name, phone: users.phone })
				.from(users)
				.where(eq(users.id, recipientId))
				.limit(1);

			if (recipient[0]?.phone) {
				// Decrypt phone and names
				const decryptedRecipientPhone = decrypt(recipient[0].phone);
				const decryptedSenderName = sender[0]?.name ? decrypt(sender[0].name) : null;

				if (isGuide) {
					// Guide replied to traveler (chat01)
					console.log('[CONVERSATIONS API] Sending guide reply AlimTalk to traveler');
					await notificationService.sendNotification({
						userId: recipientId,
						phoneNumber: decryptedRecipientPhone,
						templateName: 'chat01',
						templateData: {
							SHOPNAME: '매치트립',
							가이드: decryptedSenderName || '가이드',
							메세지확인하기: '메세지확인하기'
						}
					});
				} else {
					// Traveler sent inquiry to guide (chat02)
					console.log('[CONVERSATIONS API] Sending traveler inquiry AlimTalk to guide');
					await notificationService.sendNotification({
						userId: recipientId,
						phoneNumber: decryptedRecipientPhone,
						templateName: 'chat02',
						templateData: {
							SHOPNAME: '매치트립',
							고객: decryptedSenderName || '고객',
							메세지확인하기: '메세지확인하기'
						}
					});
				}
			}
		} catch (notificationError) {
			console.error('[CONVERSATIONS API] Failed to send AlimTalk notification:', notificationError);
		}

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

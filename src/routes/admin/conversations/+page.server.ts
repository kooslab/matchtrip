import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { conversations, messages, users, offers, trips } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	// Fetch all conversations with related data
	const allConversations = await db
		.select({
			id: conversations.id,
			createdAt: conversations.createdAt,
			updatedAt: conversations.updatedAt,
			// Traveler info
			travelerId: conversations.travelerId,
			travelerName: sql<string>`traveler.name`.as('travelerName'),
			travelerEmail: sql<string>`traveler.email`.as('travelerEmail'),
			// Guide info
			guideId: conversations.guideId,
			guideName: sql<string>`guide.name`.as('guideName'),
			guideEmail: sql<string>`guide.email`.as('guideEmail'),
			// Offer info
			offerId: conversations.offerId,
			offerStatus: offers.status,
			offerPrice: offers.price,
			// Trip info
			tripId: offers.tripId,
			tripDestination: trips.destination,
			tripStartDate: trips.startDate,
			// Message counts
			totalMessages: sql<number>`(
				SELECT COUNT(*)
				FROM ${messages}
				WHERE ${messages.conversationId} = ${conversations.id}
			)`.as('totalMessages'),
			lastMessageAt: sql<string>`(
				SELECT MAX(${messages.createdAt})
				FROM ${messages}
				WHERE ${messages.conversationId} = ${conversations.id}
			)`.as('lastMessageAt'),
			lastMessage: sql<string>`(
				SELECT ${messages.content}
				FROM ${messages}
				WHERE ${messages.conversationId} = ${conversations.id}
				ORDER BY ${messages.createdAt} DESC
				LIMIT 1
			)`.as('lastMessage'),
			unreadCount: sql<number>`(
				SELECT COUNT(*)
				FROM ${messages}
				WHERE ${messages.conversationId} = ${conversations.id}
				AND ${messages.isRead} = false
			)`.as('unreadCount')
		})
		.from(conversations)
		.leftJoin(users.as('traveler'), eq(conversations.travelerId, sql`traveler.id`))
		.leftJoin(users.as('guide'), eq(conversations.guideId, sql`guide.id`))
		.leftJoin(offers, eq(conversations.offerId, offers.id))
		.leftJoin(trips, eq(offers.tripId, trips.id))
		.orderBy(desc(sql`lastMessageAt`));

	// Calculate statistics
	const stats = {
		total: allConversations.length,
		active: allConversations.filter(c => c.totalMessages > 0).length,
		inactive: allConversations.filter(c => c.totalMessages === 0).length,
		withUnread: allConversations.filter(c => c.unreadCount > 0).length,
		totalMessages: allConversations.reduce((sum, c) => sum + (c.totalMessages || 0), 0),
		totalUnread: allConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
	};

	// Recent activity - conversations with messages in last 24 hours
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	const recentlyActive = allConversations.filter(c => 
		c.lastMessageAt && new Date(c.lastMessageAt) > yesterday
	).length;

	return {
		conversations: allConversations,
		stats: {
			...stats,
			recentlyActive
		}
	};
};
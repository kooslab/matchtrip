import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { conversations, messages, users, offers, trips } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('[ADMIN CONVERSATIONS] Starting load function');
	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	try {
		console.log('[ADMIN CONVERSATIONS] About to fetch conversations');
		// Fetch all conversations with related data using subqueries
		const allConversations = await db
			.select({
				id: conversations.id,
				createdAt: conversations.createdAt,
				updatedAt: conversations.updatedAt,
				// IDs
				travelerId: conversations.travelerId,
				guideId: conversations.guideId,
				// Traveler info via subquery
				travelerName: sql<string>`(SELECT name FROM ${users} WHERE ${users.id} = ${conversations.travelerId})`,
				travelerEmail: sql<string>`(SELECT email FROM ${users} WHERE ${users.id} = ${conversations.travelerId})`,
				// Guide info via subquery
				guideName: sql<string>`(SELECT name FROM ${users} WHERE ${users.id} = ${conversations.guideId})`,
				guideEmail: sql<string>`(SELECT email FROM ${users} WHERE ${users.id} = ${conversations.guideId})`,
				// Offer info
				offerId: conversations.offerId,
				offerStatus: offers.status,
				offerPrice: offers.price,
				// Trip info
				tripId: offers.tripId,
				tripDestination: sql<string>`(SELECT destination FROM ${trips} WHERE ${trips.id} = ${offers.tripId})`,
				// Message counts
				totalMessages: sql<number>`(
					SELECT COUNT(*)
					FROM ${messages}
					WHERE ${messages.conversationId} = ${conversations.id}
				)`,
				lastMessageAt: sql<string>`(
					SELECT MAX(created_at)
					FROM ${messages}
					WHERE ${messages.conversationId} = ${conversations.id}
				)`,
				lastMessage: sql<string>`(
					SELECT content
					FROM ${messages}
					WHERE ${messages.conversationId} = ${conversations.id}
					ORDER BY created_at DESC
					LIMIT 1
				)`,
				unreadCount: sql<number>`(
					SELECT COUNT(*)
					FROM ${messages}
					WHERE ${messages.conversationId} = ${conversations.id}
					AND is_read = false
				)`
			})
			.from(conversations)
			.leftJoin(offers, eq(conversations.offerId, offers.id))
			.orderBy(desc(conversations.updatedAt));
		
		console.log('[ADMIN CONVERSATIONS] Fetched conversations:', allConversations.length);

		// Calculate statistics
		const stats = {
			total: allConversations.length,
			active: allConversations.filter(c => c.unreadCount > 0).length,
			withMessages: allConversations.filter(c => c.totalMessages > 0).length
		};

		console.log('[ADMIN CONVERSATIONS] Done loading');
		return {
			conversations: allConversations,
			stats
		};
	} catch (error) {
		console.error('[ADMIN CONVERSATIONS] Error:', error);
		throw error;
	}
};
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { conversations } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// POST /api/conversations/[id]/mark-read - Mark messages as read
export const POST: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const conversationId = params.id;

	try {
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

		// Update last read timestamp for the current user
		const isGuide = conv.guideId === session.user.id;
		await db
			.update(conversations)
			.set({
				[isGuide ? 'guideLastReadAt' : 'travelerLastReadAt']: new Date(),
				updatedAt: new Date()
			})
			.where(eq(conversations.id, conversationId));

		return json({ success: true });
	} catch (error) {
		console.error('Error marking messages as read:', error);
		return json({ error: 'Failed to mark messages as read' }, { status: 500 });
	}
};
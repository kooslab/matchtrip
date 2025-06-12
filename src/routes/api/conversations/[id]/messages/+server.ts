import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { messages, conversations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

// Edit and delete functionality has been disabled
// The endpoints below are commented out but kept for reference

/*
// PATCH /api/conversations/[id]/messages - Edit a message
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { messageId, content } = await request.json();

		if (!messageId || !content || !content.trim()) {
			return json({ error: 'Message ID and content are required' }, { status: 400 });
		}

		// Get the message
		const message = await db
			.select()
			.from(messages)
			.where(eq(messages.id, messageId))
			.limit(1);

		if (!message.length) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		const msg = message[0];

		// Check if user is the sender
		if (msg.senderId !== session.user.id) {
			return json({ error: 'Not authorized to edit this message' }, { status: 403 });
		}

		// Check if message belongs to the conversation
		if (msg.conversationId !== params.id) {
			return json({ error: 'Message does not belong to this conversation' }, { status: 400 });
		}

		// Check if message is already deleted
		if (msg.isDeleted) {
			return json({ error: 'Cannot edit deleted message' }, { status: 400 });
		}

		// Update the message
		const updatedMessage = await db
			.update(messages)
			.set({
				content: content.trim(),
				isEdited: true,
				editedAt: new Date()
			})
			.where(eq(messages.id, messageId))
			.returning();

		return json({ message: updatedMessage[0] });
	} catch (error) {
		console.error('Error editing message:', error);
		return json({ error: 'Failed to edit message' }, { status: 500 });
	}
};

// DELETE /api/conversations/[id]/messages - Soft delete a message
export const DELETE: RequestHandler = async ({ params, request, locals }) => {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { messageId } = await request.json();

		if (!messageId) {
			return json({ error: 'Message ID is required' }, { status: 400 });
		}

		// Get the message
		const message = await db
			.select()
			.from(messages)
			.where(eq(messages.id, messageId))
			.limit(1);

		if (!message.length) {
			return json({ error: 'Message not found' }, { status: 404 });
		}

		const msg = message[0];

		// Check if user is the sender
		if (msg.senderId !== session.user.id) {
			return json({ error: 'Not authorized to delete this message' }, { status: 403 });
		}

		// Check if message belongs to the conversation
		if (msg.conversationId !== params.id) {
			return json({ error: 'Message does not belong to this conversation' }, { status: 400 });
		}

		// Soft delete the message
		const deletedMessage = await db
			.update(messages)
			.set({
				isDeleted: true,
				deletedAt: new Date(),
				content: '[삭제된 메시지]' // Korean for "Deleted message"
			})
			.where(eq(messages.id, messageId))
			.returning();

		return json({ message: deletedMessage[0] });
	} catch (error) {
		console.error('Error deleting message:', error);
		return json({ error: 'Failed to delete message' }, { status: 500 });
	}
};
*/
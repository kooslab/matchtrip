import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { productMessages, productConversations, users, fileUploads } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { uploadToR2 } from '$lib/server/r2';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;

	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const conversationId = formData.get('conversationId') as string;
		const messageType = formData.get('messageType') as string;

		if (!file || !conversationId || !messageType) {
			return json({ error: 'Missing required fields' }, { status: 400 });
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

		// Validate file based on type
		if (messageType === 'image') {
			if (!file.type.startsWith('image/')) {
				return json({ error: 'Invalid file type for image' }, { status: 400 });
			}
			if (file.size > 10 * 1024 * 1024) {
				// 10MB limit for images
				return json({ error: 'Image file too large (max 10MB)' }, { status: 400 });
			}
		} else if (messageType === 'file') {
			const allowedFileTypes = [
				'application/pdf',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
				'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // XLSX
			];
			if (!allowedFileTypes.includes(file.type)) {
				return json({ error: 'Only PDF, DOCX, PPTX, and XLSX files are allowed' }, { status: 400 });
			}
			if (file.size > 5 * 1024 * 1024) {
				// 5MB limit for PDFs
				return json({ error: 'PDF file too large (max 5MB)' }, { status: 400 });
			}
		}

		// Upload file to R2/S3
		const uploadResult = await uploadToR2(file, 'product-message');

		if (!uploadResult || !uploadResult.url) {
			return json({ error: 'File upload failed' }, { status: 500 });
		}

		// Create file upload record
		const [fileRecord] = await db
			.insert(fileUploads)
			.values({
				userId,
				filename: uploadResult.key,
				originalName: file.name,
				fileType: file.type,
				fileSize: file.size,
				uploadType: messageType === 'image' ? 'chat_image' : 'chat_file',
				url: uploadResult.url
			})
			.returning();

		// Create message with file metadata
		const [newMessage] = await db
			.insert(productMessages)
			.values({
				conversationId,
				senderId: userId,
				content: null,
				messageType,
				metadata: {
					url: uploadResult.url,
					filename: file.name,
					fileSize: file.size,
					fileType: file.type,
					fileUploadId: fileRecord.id
				}
			})
			.returning();

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
	} catch (error) {
		console.error('Error uploading file:', error);
		return json({ error: 'Failed to upload file' }, { status: 500 });
	}
};

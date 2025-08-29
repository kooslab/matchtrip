import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offerDescriptionTemplates } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/auth';

// DELETE: Delete a template
export const DELETE: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Delete only if the template belongs to the user
		const result = await db
			.delete(offerDescriptionTemplates)
			.where(
				and(
					eq(offerDescriptionTemplates.id, id),
					eq(offerDescriptionTemplates.guideId, session.user.id)
				)
			)
			.returning();

		if (result.length === 0) {
			return json({ error: 'Template not found or unauthorized' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting template:', error);
		return json({ error: 'Failed to delete template' }, { status: 500 });
	}
};

// PATCH: Update usage count
export const PATCH: RequestHandler = async ({ request, params }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { id } = params;

	try {
		// Increment usage count
		const [template] = await db
			.update(offerDescriptionTemplates)
			.set({
				usageCount: db.sql`${offerDescriptionTemplates.usageCount} + 1`,
				updatedAt: new Date()
			})
			.where(
				and(
					eq(offerDescriptionTemplates.id, id),
					eq(offerDescriptionTemplates.guideId, session.user.id)
				)
			)
			.returning();

		if (!template) {
			return json({ error: 'Template not found' }, { status: 404 });
		}

		return json({ template });
	} catch (error) {
		console.error('Error updating template:', error);
		return json({ error: 'Failed to update template' }, { status: 500 });
	}
};

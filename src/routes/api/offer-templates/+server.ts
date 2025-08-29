import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offerDescriptionTemplates } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '$lib/auth';

// GET: List user's templates
export const GET: RequestHandler = async ({ request, locals }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const templates = await db
			.select()
			.from(offerDescriptionTemplates)
			.where(eq(offerDescriptionTemplates.guideId, session.user.id))
			.orderBy(desc(offerDescriptionTemplates.createdAt));

		return json({ templates });
	} catch (error) {
		console.error('Error fetching templates:', error);
		return json({ error: 'Failed to fetch templates' }, { status: 500 });
	}
};

// POST: Create new template
export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { title, description } = await request.json();

		if (!title || !description) {
			return json({ error: 'Title and description are required' }, { status: 400 });
		}

		const [template] = await db
			.insert(offerDescriptionTemplates)
			.values({
				guideId: session.user.id,
				title: title.trim(),
				description
			})
			.returning();

		return json({ template });
	} catch (error) {
		console.error('Error creating template:', error);
		return json({ error: 'Failed to create template' }, { status: 500 });
	}
};

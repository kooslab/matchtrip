import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { faqs } from '$lib/server/db/schema';
import { eq, or, and, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	const role = url.searchParams.get('role') as 'guide' | 'traveler' | null;

	if (!role || (role !== 'guide' && role !== 'traveler')) {
		return json({ error: 'Invalid role parameter' }, { status: 400 });
	}

	try {
		// Fetch FAQs that are active and match the user's role or are for 'both'
		const faqList = await db
			.select({
				id: faqs.id,
				title: faqs.title,
				content: faqs.content,
				targetRole: faqs.targetRole,
				displayOrder: faqs.displayOrder
			})
			.from(faqs)
			.where(
				and(
					eq(faqs.isActive, true),
					or(eq(faqs.targetRole, role), eq(faqs.targetRole, 'both'))
				)
			)
			.orderBy(asc(faqs.displayOrder), asc(faqs.createdAt));

		return json(faqList);
	} catch (error) {
		console.error('Error fetching FAQs:', error);
		return json({ error: 'Failed to fetch FAQs' }, { status: 500 });
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { announcements } from '$lib/server/db/schema';
import { and, eq, lte, gte, or, isNull } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const now = new Date();

		// Fetch active announcements where:
		// 1. isActive is true
		// 2. startDate is null OR startDate <= now
		// 3. endDate is null OR endDate >= now
		const activeAnnouncements = await db
			.select()
			.from(announcements)
			.where(
				and(
					eq(announcements.isActive, true),
					or(isNull(announcements.startDate), lte(announcements.startDate, now)),
					or(isNull(announcements.endDate), gte(announcements.endDate, now))
				)
			)
			.orderBy(announcements.createdAt); // Show oldest first

		return json(activeAnnouncements);
	} catch (error) {
		console.error('Error fetching announcements:', error);
		return json({ error: 'Failed to fetch announcements' }, { status: 500 });
	}
};

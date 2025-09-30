import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/events/active - Get currently active event
export const GET: RequestHandler = async () => {
	try {
		const [activeEvent] = await db.select().from(events).where(eq(events.isActive, true)).limit(1);

		if (!activeEvent) {
			return json({ event: null });
		}

		return json({ event: activeEvent });
	} catch (err) {
		console.error('Error fetching active event:', err);
		return json({ event: null }, { status: 500 });
	}
};
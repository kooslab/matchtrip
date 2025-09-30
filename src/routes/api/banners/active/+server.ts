import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { banners } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/banners/active - Get currently active banner
export const GET: RequestHandler = async () => {
	try {
		const [activeBanner] = await db.select().from(banners).where(eq(banners.isActive, true)).limit(1);

		if (!activeBanner) {
			return json({ banner: null });
		}

		return json({ banner: activeBanner });
	} catch (err) {
		console.error('Error fetching active banner:', err);
		return json({ banner: null }, { status: 500 });
	}
};
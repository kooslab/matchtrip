import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { destinations } from '$lib/server/db/schema';
import { desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const allDestinations = await db
		.select()
		.from(destinations)
		.orderBy(desc(destinations.created_at));

	return {
		destinations: allDestinations
	};
};
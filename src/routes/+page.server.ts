import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { destinations } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ setHeaders }) => {
	// Set cache headers for better performance
	setHeaders({
		'cache-control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
		'cdn-cache-control': 'max-age=3600' // CDN cache for 1 hour
	});

	// Fetch all destinations from the database
	const allDestinations = await db.select().from(destinations).orderBy(destinations.city);

	return {
		destinations: allDestinations
	};
};
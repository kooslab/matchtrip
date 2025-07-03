import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { destinations } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ setHeaders, parent, url }) => {
	console.log('[PAGE SERVER] Starting page load');
	console.log('[PAGE SERVER] URL:', url.toString());

	// Set cache headers for better performance
	setHeaders({
		'cache-control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
		'cdn-cache-control': 'max-age=3600' // CDN cache for 1 hour
	});

	// Get parent data (user, session, etc.)
	console.log('[PAGE SERVER] Getting parent data');
	const parentData = await parent();
	console.log(
		'[PAGE SERVER] Parent data received:',
		JSON.stringify(
			{
				hasUser: !!parentData.user,
				hasSession: !!parentData.session,
				userRole: parentData.userRole
			},
			null,
			2
		)
	);

	// Fetch all destinations from the database
	console.log('[PAGE SERVER] Fetching destinations');
	const allDestinations = await db.select().from(destinations).orderBy(destinations.city);
	console.log('[PAGE SERVER] Found destinations:', allDestinations.length);

	const returnData = {
		...parentData,
		destinations: allDestinations
	};

	console.log('[PAGE SERVER] Returning combined data');
	return returnData;
};

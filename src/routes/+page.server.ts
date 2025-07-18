import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { destinations } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ setHeaders, parent, url }) => {
	console.log('[PAGE SERVER] Starting page load');
	console.log('[PAGE SERVER] URL:', url.toString());

	// Set cache headers - disable caching for authenticated pages to ensure fresh session data
	// This is especially important for Safari which has stricter cookie policies
	setHeaders({
		'cache-control': 'private, no-cache, no-store, must-revalidate',
		pragma: 'no-cache',
		expires: '0'
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

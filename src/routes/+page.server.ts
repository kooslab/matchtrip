import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq, sql, or, ilike } from 'drizzle-orm';

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

	// Get search query from URL
	const searchQuery = url.searchParams.get('q') || '';
	
	// Build destination query
	let destinationQuery = db
		.select({
			id: destinations.id,
			city: destinations.city,
			imageUrl: destinations.imageUrl,
			country: countries.name,
			countryCode: countries.code,
			continent: continents.name
		})
		.from(destinations)
		.innerJoin(countries, eq(destinations.countryId, countries.id))
		.innerJoin(continents, eq(countries.continentId, continents.id));
	
	// Apply search filter if query exists
	if (searchQuery.trim()) {
		console.log('[PAGE SERVER] Searching for:', searchQuery);
		destinationQuery = destinationQuery.where(
			or(
				ilike(destinations.city, `%${searchQuery}%`),
				ilike(countries.name, `%${searchQuery}%`)
			)
		);
	}
	
	// Fetch destinations
	console.log('[PAGE SERVER] Fetching destinations');
	const allDestinations = await destinationQuery;
	console.log('[PAGE SERVER] Found destinations:', allDestinations.length);
	
	// Get 6 random destinations for display (from all destinations if no search)
	const displayPool = searchQuery.trim() ? allDestinations : allDestinations;
	const shuffled = [...displayPool].sort(() => 0.5 - Math.random());
	const displayDestinations = shuffled.slice(0, 6);

	const returnData = {
		...parentData,
		searchQuery,
		destinations: allDestinations,
		displayDestinations: displayDestinations
	};

	console.log('[PAGE SERVER] Returning combined data');
	return returnData;
};

import type { PageLoad } from './$types';

// Simple in-memory cache for destinations
const destinationsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const load: PageLoad = async ({ fetch, url, depends, parent }) => {
	// Get parent data to merge with destinations
	const parentData = await parent();

	// Depend on a custom identifier for cache invalidation
	depends('app:destinations');

	const searchQuery = url.searchParams.get('q') || '';
	const cacheKey = `destinations:${searchQuery}`;

	// Check cache first (only for non-search queries)
	if (!searchQuery) {
		const cached = destinationsCache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
			console.log('[CLIENT] Using cached destinations');
			const displayDestinations = getRandomDestinations(cached.data.results, 6);
			return {
				...parentData,
				destinations: cached.data.results || [],
				displayDestinations,
				searchQuery,
				fromCache: true
			};
		}
	}

	try {
		// Fetch destinations from API endpoint
		const response = await fetch(`/api/destinations?q=${encodeURIComponent(searchQuery)}`);

		if (!response.ok) {
			throw new Error('Failed to fetch destinations');
		}

		const data = await response.json();

		// Cache the response (only for non-search queries)
		if (!searchQuery) {
			destinationsCache.set(cacheKey, {
				data,
				timestamp: Date.now()
			});
		}

		// Get random destinations for display
		const displayDestinations = getRandomDestinations(data.results, 6);

		return {
			...parentData,
			destinations: data.results || [],
			displayDestinations,
			searchQuery,
			fromCache: false
		};
	} catch (error) {
		console.error('[CLIENT] Error fetching destinations:', error);
		// Return empty data on error but preserve parent data
		return {
			...parentData,
			destinations: [],
			displayDestinations: [],
			searchQuery,
			fromCache: false
		};
	}
};

// Helper function to get random destinations
function getRandomDestinations(destinations: any[], count: number) {
	if (!destinations || destinations.length === 0) return [];
	const shuffled = [...destinations].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, count);
}

// Function to clear the cache when needed (not exported due to SvelteKit restrictions)
// This can be called internally when needed
function clearDestinationsCache() {
	destinationsCache.clear();
}

import type { PageLoad } from './$types';

// Note: Caching disabled for random destinations since we want fresh random results each time

export const load: PageLoad = async ({ fetch, url, depends, parent }) => {
	// Get parent data to merge with destinations
	const parentData = await parent();

	// Depend on a custom identifier for cache invalidation
	depends('app:destinations');

	const searchQuery = url.searchParams.get('q') || '';

	try {
		// For home page (no search), get 6 random destinations from API
		let response;
		let displayDestinations;

		if (!searchQuery) {
			// Fetch 6 random destinations directly from API
			response = await fetch('/api/destinations?random=6');

			if (!response.ok) {
				throw new Error('Failed to fetch random destinations');
			}

			const data = await response.json();
			// Use the random results directly - no client-side shuffling needed!
			displayDestinations = data.results || [];
		} else {
			// For search queries, fetch filtered results
			response = await fetch(`/api/destinations?q=${encodeURIComponent(searchQuery)}`);

			if (!response.ok) {
				throw new Error('Failed to fetch destinations');
			}

			const data = await response.json();
			// For search results, just show all results (no randomization)
			displayDestinations = data.results || [];
		}

		return {
			...parentData,
			destinations: displayDestinations, // For simplicity, just use displayDestinations
			displayDestinations,
			searchQuery
		};
	} catch (error) {
		console.error('Error fetching destinations:', error);
		// Return empty data on error but preserve parent data
		return {
			...parentData,
			destinations: [],
			displayDestinations: [],
			searchQuery
		};
	}
};

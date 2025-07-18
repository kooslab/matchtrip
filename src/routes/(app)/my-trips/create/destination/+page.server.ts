import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all destinations from database with country and continent info
		const allDestinations = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				imageUrl: destinations.imageUrl,
				country: {
					id: countries.id,
					name: countries.name,
					code: countries.code
				},
				continent: {
					id: continents.id,
					name: continents.name,
					code: continents.code
				}
			})
			.from(destinations)
			.innerJoin(countries, eq(destinations.countryId, countries.id))
			.innerJoin(continents, eq(countries.continentId, continents.id))
			.orderBy(destinations.city);

		// Group destinations by continent
		const groupedDestinations: Record<string, typeof allDestinations> = {};

		// Continent name mapping
		const continentNameMap: Record<string, string> = {
			Asia: '아시아',
			Europe: '유럽',
			'North America': '북미',
			'South America': '남미',
			Africa: '아프리카',
			Oceania: '오세아니아',
			Antarctica: '남극'
		};

		allDestinations.forEach((dest) => {
			const continentName = continentNameMap[dest.continent.name] || dest.continent.name;

			// Special handling for Korea - put it in a separate group
			if (dest.country.code === 'KOR' || dest.country.name === '대한민국') {
				if (!groupedDestinations['국내']) {
					groupedDestinations['국내'] = [];
				}
				groupedDestinations['국내'].push(dest);
			} else {
				if (!groupedDestinations[continentName]) {
					groupedDestinations[continentName] = [];
				}
				groupedDestinations[continentName].push(dest);
			}
		});

		// Remove empty groups
		Object.keys(groupedDestinations).forEach((key) => {
			if (groupedDestinations[key].length === 0) {
				delete groupedDestinations[key];
			}
		});

		console.log('groupedDestinations', groupedDestinations);

		return {
			destinations: groupedDestinations
		};
	} catch (error) {
		console.error('Error loading destinations:', error);
		return {
			destinations: {}
		};
	}
};

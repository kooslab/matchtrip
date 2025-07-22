import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	// Get trip data from parent layout
	const parentData = await parent();
	
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
			.orderBy(countries.name, destinations.city);

		// Group destinations by country
		const groupedDestinations: Record<string, typeof allDestinations> = {};

		allDestinations.forEach((dest) => {
			const countryName = dest.country.name;
			
			if (!groupedDestinations[countryName]) {
				groupedDestinations[countryName] = [];
			}
			groupedDestinations[countryName].push(dest);
		});

		// Sort countries (Korea first if exists, then alphabetically)
		const sortedGroupedDestinations: Record<string, typeof allDestinations> = {};
		const sortedCountries = Object.keys(groupedDestinations).sort((a, b) => {
			// Put Korea first
			if (a === '대한민국' || a === 'South Korea') return -1;
			if (b === '대한민국' || b === 'South Korea') return 1;
			// Then sort alphabetically
			return a.localeCompare(b, 'ko');
		});

		sortedCountries.forEach(country => {
			sortedGroupedDestinations[country] = groupedDestinations[country];
		});

		console.log('Grouped destinations by country:', Object.keys(sortedGroupedDestinations).length, 'countries');

		return {
			...parentData,
			destinations: sortedGroupedDestinations
		};
	} catch (error) {
		console.error('Error loading destinations:', error);
		return {
			...parentData,
			destinations: {}
		};
	}
};
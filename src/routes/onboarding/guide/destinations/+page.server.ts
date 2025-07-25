import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Fetch all destinations grouped by continent and country
	const allDestinations = await db
		.select({
			id: destinations.id,
			city: destinations.city,
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
		.orderBy(continents.name, countries.name, destinations.city);

	// Group destinations by continent and country
	const groupedDestinations = allDestinations.reduce((acc, dest) => {
		const continentName = dest.continent.name;
		const countryName = dest.country.name;
		
		if (!acc[continentName]) {
			acc[continentName] = {
				name: continentName,
				code: dest.continent.code,
				countries: {}
			};
		}
		
		if (!acc[continentName].countries[countryName]) {
			acc[continentName].countries[countryName] = {
				name: countryName,
				code: dest.country.code,
				cities: []
			};
		}
		
		acc[continentName].countries[countryName].cities.push({
			id: dest.id,
			name: dest.city
		});
		
		return acc;
	}, {} as Record<string, { name: string; code: string; countries: Record<string, { name: string; code: string; cities: Array<{ id: number; name: string }> }> }>);

	// Convert to array format for easier iteration
	const destinationRegions = Object.values(groupedDestinations).map(continent => ({
		name: continent.name,
		code: continent.code,
		countries: Object.values(continent.countries).map(country => ({
			name: country.name,
			code: country.code,
			cities: country.cities
		}))
	}));

	return {
		destinationRegions
	};
};
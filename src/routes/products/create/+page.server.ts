import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ parent }) => {
	await parent(); // Ensure layout runs first

	try {
		// Fetch all destinations with their countries and continents
		const allDestinations = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				imageUrl: destinations.imageUrl,
				countryId: countries.id,
				countryName: countries.name,
				countryCode: countries.code,
				continentId: continents.id,
				continentName: continents.name,
				continentCode: continents.code
			})
			.from(destinations)
			.innerJoin(countries, eq(destinations.countryId, countries.id))
			.innerJoin(continents, eq(countries.continentId, continents.id))
			.orderBy(continents.name, countries.name, destinations.city);

		// Group destinations by continent and country
		const groupedDestinations: Record<
			string,
			{
				name: string;
				code: string;
				countries: Record<
					string,
					{
						name: string;
						code: string;
						destinations: Array<{
							id: number;
							city: string;
							imageUrl: string | null;
						}>;
					}
				>;
			}
		> = {};

		allDestinations.forEach((dest) => {
			const continentName = dest.continentName;
			const countryName = dest.countryName;

			// Initialize continent if not exists
			if (!groupedDestinations[continentName]) {
				groupedDestinations[continentName] = {
					name: continentName,
					code: dest.continentCode,
					countries: {}
				};
			}

			// Initialize country if not exists
			if (!groupedDestinations[continentName].countries[countryName]) {
				groupedDestinations[continentName].countries[countryName] = {
					name: countryName,
					code: dest.countryCode,
					destinations: []
				};
			}

			// Add destination
			groupedDestinations[continentName].countries[countryName].destinations.push({
				id: dest.id,
				city: dest.city,
				imageUrl: dest.imageUrl
			});
		});

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

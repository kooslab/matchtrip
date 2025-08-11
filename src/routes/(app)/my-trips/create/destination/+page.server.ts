import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { transformImageUrl } from '$lib/utils/imageUrl';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Fetch all destinations with their countries
		const allDestinations = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				imageUrl: destinations.imageUrl,
				countryId: countries.id,
				countryName: countries.name,
				countryCode: countries.code
			})
			.from(destinations)
			.innerJoin(countries, eq(destinations.countryId, countries.id))
			.orderBy(countries.name, destinations.city);

		// Group destinations by country
		const groupedDestinations: Record<string, Array<{
			id: number;
			city: string;
			imageUrl: string | null;
			country: {
				id: number;
				name: string;
				code: string;
			};
		}>> = {};
		
		allDestinations.forEach((dest) => {
			const countryName = dest.countryName;
			if (!groupedDestinations[countryName]) {
				groupedDestinations[countryName] = [];
			}
			groupedDestinations[countryName].push({
				id: dest.id,
				city: dest.city,
				imageUrl: transformImageUrl(dest.imageUrl),
				country: {
					id: dest.countryId,
					name: dest.countryName,
					code: dest.countryCode
				}
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

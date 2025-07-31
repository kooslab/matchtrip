import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const q = url.searchParams.get('q')?.trim();

	// Set cache headers based on query type
	if (q) {
		// Don't cache search results heavily
		setHeaders({
			'cache-control': 'private, max-age=60, s-maxage=60', // Cache for 1 minute
			vary: 'Accept-Encoding'
		});
	} else {
		// Cache general destinations list for longer
		setHeaders({
			'cache-control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60', // Cache for 5 minutes
			'cdn-cache-control': 'max-age=300',
			vary: 'Accept-Encoding'
		});
	}

	// If no query, return all destinations
	if (!q || q.length === 0) {
		try {
			const results = await db
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
				.orderBy(destinations.city)
				.limit(50);

			return json({ results });
		} catch (error) {
			console.error('Error fetching all destinations:', error);
			return json({ results: [], error: 'Database error' }, { status: 500 });
		}
	}

	if (q.length < 2) {
		return json({ results: [] });
	}

	try {
		// Use more efficient query with early termination
		const results = await db
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
			.where(
				sql`
					${destinations.city} ILIKE ${`${q}%`} 
					OR ${destinations.city} ILIKE ${`%${q}%`}
					OR ${countries.name} ILIKE ${`${q}%`}
				`
			)
			.orderBy(
				sql`
					CASE 
						WHEN ${destinations.city} ILIKE ${`${q}%`} THEN 1
						WHEN ${countries.name} ILIKE ${`${q}%`} THEN 2
						ELSE 3
					END
				`
			)
			.limit(10);

		return json({ results });
	} catch (error) {
		console.error('Error querying destinations:', error);
		return json({ results: [], error: 'Database error' }, { status: 500 });
	}
};

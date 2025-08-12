import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { destinations, countries, continents } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { transformImageUrl } from '$lib/utils/imageUrl';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const q = url.searchParams.get('q')?.trim();
	const random = url.searchParams.get('random'); // Get random count parameter

	// Set cache headers based on query type
	if (q || random) {
		// Don't cache search results or random results heavily
		setHeaders({
			'cache-control': 'private, no-cache, max-age=0', // No caching for random results
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

	// If requesting random destinations
	if (random) {
		try {
			const count = parseInt(random) || 6;
			// Use PostgreSQL's RANDOM() function to get random destinations
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
				.orderBy(sql`RANDOM()`) // PostgreSQL random ordering
				.limit(count);
			
			// Transform image URLs
			const transformedResults = results.map(destination => ({
				...destination,
				imageUrl: transformImageUrl(destination.imageUrl, 'destination')
			}));
			
			return json({ results: transformedResults, random: true });
		} catch (error) {
			console.error('Error fetching random destinations:', error);
			return json({ results: [], error: 'Database error' }, { status: 500 });
		}
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

			// Transform image URLs - destination images go to public bucket
			const transformedResults = results.map(destination => ({
				...destination,
				imageUrl: transformImageUrl(destination.imageUrl, 'destination')
			}));

			return json({ results: transformedResults });
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

		// Transform image URLs - destination images go to public bucket  
		const transformedResults = results.map(destination => ({
			...destination,
			imageUrl: transformImageUrl(destination.imageUrl, 'destination')
		}));

		return json({ results: transformedResults });
	} catch (error) {
		console.error('Error querying destinations:', error);
		return json({ results: [], error: 'Database error' }, { status: 500 });
	}
};

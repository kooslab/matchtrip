import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { destinations, users, countries, continents } from '$lib/server/db/schema';
import { ilike, or, eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const q = url.searchParams.get('q')?.trim();

	// Set cache headers for better performance
	setHeaders({
		'cache-control': 'public, max-age=300, s-maxage=300', // Cache for 5 minutes
		'cdn-cache-control': 'max-age=300'
	});

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

export const POST: RequestHandler = async ({ request }) => {
	// Check if user is admin
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Fetch user role from database
	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: { role: true }
	});

	if (!user || user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { city, countryId, imageUrl } = await request.json();

		if (!city || !countryId) {
			return json({ error: 'City and country ID are required' }, { status: 400 });
		}

		// Verify the country exists
		const country = await db.query.countries.findFirst({
			where: eq(countries.id, countryId)
		});

		if (!country) {
			return json({ error: 'Invalid country ID' }, { status: 400 });
		}

		const [newDestination] = await db
			.insert(destinations)
			.values({
				city,
				countryId,
				imageUrl
			})
			.returning();

		return json(newDestination);
	} catch (error: any) {
		console.error('Error creating destination:', error);

		// Handle unique constraint violation
		if (error.code === '23505' && error.constraint === 'destinations_city_unique') {
			return json({ error: 'A destination with this city already exists' }, { status: 409 });
		}

		return json({ error: 'Failed to create destination' }, { status: 500 });
	}
};

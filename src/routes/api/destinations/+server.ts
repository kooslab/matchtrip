import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { destinations } from '$lib/server/db/schema';
import { ilike, or } from 'drizzle-orm';

export async function GET({ url }) {
	const q = url.searchParams.get('q')?.trim();
	if (!q) return json({ results: [] });

	// Case-insensitive partial match for city or country
	const results = await db
		.select()
		.from(destinations)
		.where(or(ilike(destinations.city, `%${q}%`), ilike(destinations.country, `%${q}%`)))
		.limit(10);

	return json({ results });
}

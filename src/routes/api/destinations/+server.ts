import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import staticDestinations from '$lib/server/staticDestinations.json';

// Service is paused: the database has been shut down, so destinations are served
// from a static snapshot (images still live on the public R2 bucket).
type Destination = (typeof staticDestinations)[number];

const all: Destination[] = staticDestinations;

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const q = url.searchParams.get('q')?.trim();
	const random = url.searchParams.get('random');

	if (q || random) {
		setHeaders({ 'cache-control': 'private, no-cache, max-age=0' });
	} else {
		setHeaders({ 'cache-control': 'public, max-age=300, s-maxage=300' });
	}

	if (random) {
		const count = parseInt(random) || 6;
		return json({ results: shuffle(all).slice(0, count), random: true });
	}

	if (!q) {
		return json({ results: all.slice(0, 50) });
	}

	if (q.length < 2) {
		return json({ results: [] });
	}

	const needle = q.toLowerCase();
	const rank = (d: Destination) => {
		const city = d.city.toLowerCase();
		if (city.startsWith(needle)) return 1;
		if (d.country.name.toLowerCase().startsWith(needle)) return 2;
		if (city.includes(needle)) return 3;
		return 0;
	};

	const results = all
		.map((d) => ({ d, r: rank(d) }))
		.filter(({ r }) => r > 0)
		.sort((a, b) => a.r - b.r)
		.slice(0, 10)
		.map(({ d }) => d);

	return json({ results });
};

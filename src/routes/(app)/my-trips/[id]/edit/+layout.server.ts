import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { trips } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load = (async ({ params, locals }) => {
	const session = locals.session;

	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const trip = await db.query.trips.findFirst({
		where: eq(trips.id, params.id),
		with: {
			destination: {
				with: {
					country: true
				}
			}
		}
	});

	if (!trip) {
		throw error(404, 'Trip not found');
	}

	if (trip.userId !== session.user.id) {
		throw error(403, 'Forbidden');
	}

	return {
		trip
	};
}) satisfies LayoutServerLoad;

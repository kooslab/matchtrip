import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trips } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session?.user || !user) {
		redirect(302, '/');
	}

	// Check if user is a guide
	if (user.role !== 'guide') {
		redirect(302, '/trips');
	}

	// Get tripId from query params
	const tripId = url.searchParams.get('tripId');
	if (!tripId) {
		redirect(302, '/trips');
	}

	// Fetch trip details
	const trip = await db.query.trips.findFirst({
		where: eq(trips.id, tripId),
		with: {
			user: true
		}
	});

	if (!trip) {
		redirect(302, '/trips');
	}

	return {
		trip
	};
};

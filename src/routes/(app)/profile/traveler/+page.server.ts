import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { travelerProfiles, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}

	// Check if user is a traveler
	if (locals.user.role !== 'traveler') {
		throw redirect(302, '/');
	}

	// Get user data with traveler profile
	const userWithProfile = await db
		.select()
		.from(users)
		.leftJoin(travelerProfiles, eq(users.id, travelerProfiles.userId))
		.where(eq(users.id, locals.user.id))
		.then((rows) => rows[0]);

	if (!userWithProfile) {
		throw redirect(302, '/');
	}

	return {
		user: userWithProfile.users,
		travelerProfile: userWithProfile.traveler_profiles
	};
};

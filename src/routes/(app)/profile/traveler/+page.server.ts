import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { travelerProfiles, users, trips } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check if user is a traveler
	if (locals.user.role !== 'traveler') {
		throw redirect(302, '/login');
	}

	// Get user data with traveler profile
	const userWithProfile = await db
		.select()
		.from(users)
		.leftJoin(travelerProfiles, eq(users.id, travelerProfiles.userId))
		.where(eq(users.id, locals.user.id))
		.then((rows) => rows[0]);

	if (!userWithProfile) {
		throw redirect(302, '/login');
	}

	// Decrypt user fields before sending to client
	const decryptedUser = decryptUserFields(userWithProfile.users);

	// Get metrics
	const [totalTrips, completedTrips] = await Promise.all([
		// Total trips count
		db.select({ count: count() })
			.from(trips)
			.where(eq(trips.userId, locals.user.id))
			.then(rows => rows[0]?.count || 0),

		// Completed trips count
		db.select({ count: count() })
			.from(trips)
			.where(and(
				eq(trips.userId, locals.user.id),
				eq(trips.status, 'completed')
			))
			.then(rows => rows[0]?.count || 0)
	]);

	return {
		user: decryptedUser,
		travelerProfile: userWithProfile.traveler_profiles,
		metrics: {
			totalTrips,
			completedTrips,
			favoriteGuides: 0 // Feature not implemented yet
		}
	};
};

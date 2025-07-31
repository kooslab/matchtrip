import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// You must have user info in locals (e.g., from your auth system)
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/');
	}

	// Fetch user info
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)
		.then((rows) => rows[0]);
	if (!user) {
		return { user: null, userRole: null, userName: null, guideProfile: null };
	}

	// Fetch guide profile (if exists)
	const guideProfile = await db
		.select()
		.from(guideProfiles)
		.where(eq(guideProfiles.userId, userId))
		.limit(1)
		.then((rows) => rows[0]);

	return {
		user,
		userRole: user.role,
		userName: user.name,
		guideProfile
	};
};

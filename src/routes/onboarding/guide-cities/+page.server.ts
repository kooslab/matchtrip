import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Use locals.user which is already populated by hooks.server.ts
	if (!locals.user) {
		return {
			guideProfile: null
		};
	}

	// Fetch guide profile to get existing selected cities
	const guideProfile = await db
		.select()
		.from(guideProfiles)
		.where(eq(guideProfiles.userId, locals.user.id))
		.limit(1);

	return {
		guideProfile: guideProfile[0] || null
	};
};
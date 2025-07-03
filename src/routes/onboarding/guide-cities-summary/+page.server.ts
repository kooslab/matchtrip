import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Use locals.user which is already populated by hooks.server.ts
	if (!locals.user) {
		redirect(302, '/signin');
	}

	// Fetch guide profile to get selected cities
	const guideProfile = await db
		.select()
		.from(guideProfiles)
		.where(eq(guideProfiles.userId, locals.user.id))
		.limit(1);

	if (!guideProfile[0]) {
		// If no guide profile exists, redirect to guide profile creation
		redirect(302, '/onboarding/guide-profile');
	}

	return {
		guideProfile: guideProfile[0]
	};
};
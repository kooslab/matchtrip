import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.user) {
		redirect(302, '/signin');
	}

	// Check if user has agreed to terms
	if (!locals.hasAgreedToTerms) {
		redirect(302, '/agreement');
	}

	// Check if user has selected a role
	if (!locals.user.role) {
		redirect(302, '/select-role');
	}

	// This page is only for guides
	if (locals.user.role !== 'guide') {
		redirect(302, '/onboarding/birthdate');
	}

	// Check if user has set their name
	if (!locals.user.name || locals.user.name.trim().length === 0) {
		redirect(302, '/onboarding/name');
	}

	// Check if user has set their phone
	if (!locals.user.phone) {
		redirect(302, '/onboarding/guide-phone');
	}

	// Fetch existing guide profile if any
	let guideProfile = null;
	if (locals.user.id) {
		guideProfile = await db.query.guideProfiles.findFirst({
			where: eq(guideProfiles.userId, locals.user.id),
			columns: {
				profileImageUrl: true,
				introduction: true
			}
		});
	}

	return {
		user: locals.user,
		guideProfile
	};
};

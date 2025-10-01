import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, depends }) => {
	const user = locals.user;

	if (!user) {
		throw redirect(302, '/sign-in');
	}

	if (user.role !== 'guide') {
		throw redirect(302, '/');
	}

	// Add dependency for invalidation
	depends('app:guide-verification');

	// Get guide profile
	const guideProfile = await db.query.guideProfiles.findFirst({
		where: eq(guideProfiles.userId, user.id)
	});

	if (!guideProfile) {
		// If no guide profile exists, redirect to onboarding
		throw redirect(302, '/onboarding/guide');
	}

	if (guideProfile.isVerified) {
		throw redirect(302, '/trips');
	}

	return {
		user: {
			name: user.name,
			email: user.email,
			phone: (user as any).phone
		},
		guideProfile: {
			isVerified: guideProfile.isVerified,
			createdAt: guideProfile.createdAt.toISOString()
		}
	};
};

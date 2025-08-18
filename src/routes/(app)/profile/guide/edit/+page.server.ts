import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { guideProfiles, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		throw redirect(302, '/');
	}

	if (user.role !== 'guide') {
		throw redirect(302, '/');
	}

	// Get guide profile
	const [guideProfile] = await db
		.select()
		.from(guideProfiles)
		.where(eq(guideProfiles.userId, user.id))
		.limit(1);

	return {
		user,
		guideProfile
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const session = locals.session;
		const user = locals.user;

		if (!session || !user || user.role !== 'guide') {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const bio = formData.get('bio') as string;
		const languages = formData.get('languages') as string;
		const specialties = formData.get('specialties') as string;
		const experience = formData.get('experience') as string;

		try {
			// Update user name
			if (name && name !== user.name) {
				await db.update(users).set({ name }).where(eq(users.id, user.id));
			}

			// Check if guide profile exists
			const [existingProfile] = await db
				.select()
				.from(guideProfiles)
				.where(eq(guideProfiles.userId, user.id))
				.limit(1);

			const profileData = {
				bio: bio || '',
				languages: languages ? languages.split(',').map((l) => l.trim()) : [],
				specialties: specialties ? specialties.split(',').map((s) => s.trim()) : [],
				experience: experience || '',
				updatedAt: new Date()
			};

			if (existingProfile) {
				// Update existing profile
				await db.update(guideProfiles).set(profileData).where(eq(guideProfiles.userId, user.id));
			} else {
				// Create new profile
				await db.insert(guideProfiles).values({
					userId: user.id,
					...profileData,
					rating: 0,
					reviewCount: 0,
					completedTrips: 0,
					responseRate: 100,
					responseTime: '1시간 이내',
					isVerified: false
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating profile:', error);
			return fail(500, { error: 'Failed to update profile' });
		}
	}
};

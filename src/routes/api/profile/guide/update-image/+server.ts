import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user || user.role !== 'guide') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { profileImageUrl } = await request.json();

		if (!profileImageUrl) {
			return json({ error: 'No image URL provided' }, { status: 400 });
		}

		// Check if guide profile exists
		const [existingProfile] = await db
			.select()
			.from(guideProfiles)
			.where(eq(guideProfiles.userId, user.id))
			.limit(1);

		if (existingProfile) {
			// Update existing profile
			await db
				.update(guideProfiles)
				.set({
					profileImageUrl,
					updatedAt: new Date()
				})
				.where(eq(guideProfiles.userId, user.id));
		} else {
			// Create new profile with image
			await db.insert(guideProfiles).values({
				userId: user.id,
				profileImageUrl,
				bio: '',
				languages: [],
				specialties: [],
				experience: '',
				rating: 0,
				reviewCount: 0,
				completedTrips: 0,
				responseRate: 100,
				responseTime: '1시간 이내',
				isVerified: false
			});
		}

		return json({ success: true, profileImageUrl });
	} catch (error) {
		console.error('Error updating profile image:', error);
		return json({ error: 'Failed to update profile image' }, { status: 500 });
	}
};

import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
	}

	try {
		const body = await request.json();
		const { introduction, profileImageUrl, username, location, activityAreas } = body;

		// Create or update guide profile
		const existingProfile = await db
			.select()
			.from(guideProfiles)
			.where(eq(guideProfiles.userId, userId))
			.limit(1);

		const profileData: any = {};
		if (introduction !== undefined) profileData.introduction = introduction;
		if (profileImageUrl !== undefined) profileData.profileImageUrl = profileImageUrl;
		if (username !== undefined) profileData.username = username;
		if (location !== undefined) profileData.currentLocation = location;
		if (activityAreas !== undefined) profileData.activityAreas = activityAreas;

		if (existingProfile.length > 0) {
			// Update existing profile
			await db
				.update(guideProfiles)
				.set({
					...profileData,
					updatedAt: new Date()
				})
				.where(eq(guideProfiles.userId, userId));
		} else {
			// Create new profile
			await db.insert(guideProfiles).values({
				userId,
				...profileData
			});
		}

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		console.error('Guide profile error:', err);
		return new Response(JSON.stringify({ success: false, error: 'DB error' }), { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
	}

	try {
		const body = await request.json();
		const { introduction, profileImageUrl, username, location, activityAreas } = body;

		const updateData: any = {};
		if (introduction !== undefined) updateData.introduction = introduction;
		if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
		if (username !== undefined) updateData.username = username;
		if (location !== undefined) updateData.currentLocation = location;
		if (activityAreas !== undefined) updateData.activityAreas = activityAreas;

		await db
			.update(guideProfiles)
			.set({
				...updateData,
				updatedAt: new Date()
			})
			.where(eq(guideProfiles.userId, userId));

		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		console.error('Guide profile update error:', err);
		return new Response(JSON.stringify({ success: false, error: 'DB error' }), { status: 500 });
	}
};

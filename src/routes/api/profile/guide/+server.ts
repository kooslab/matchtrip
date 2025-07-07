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
		const formData = await request.formData();
		
		// Extract form fields
		const name = formData.get('name')?.toString();
		const phone = formData.get('phone')?.toString();
		const nickname = formData.get('nickname')?.toString();
		const frequentArea = formData.get('frequentArea')?.toString();
		const birthDate = formData.get('birthDate')?.toString();
		const destinationsStr = formData.get('destinations')?.toString();
		
		let destinations: string[] = [];
		if (destinationsStr) {
			try {
				destinations = JSON.parse(destinationsStr);
			} catch (e) {
				console.error('Error parsing destinations:', e);
			}
		}

		// Handle file uploads - for now we'll just log them
		// In a real implementation, you'd upload these to S3/R2 and store URLs
		const documentFiles: Record<string, File[]> = {};
		for (const [key, value] of formData.entries()) {
			if (key.startsWith('documents_') && value instanceof File) {
				const categoryId = key.replace('documents_', '');
				if (!documentFiles[categoryId]) {
					documentFiles[categoryId] = [];
				}
				documentFiles[categoryId].push(value);
			}
		}

		console.log('Uploaded documents:', Object.keys(documentFiles).map(cat => `${cat}: ${documentFiles[cat].length} files`));

		// Create or update guide profile
		const existingProfile = await db
			.select()
			.from(guideProfiles)
			.where(eq(guideProfiles.userId, userId))
			.limit(1);

		const profileData: any = {
			username: nickname,
			currentLocation: frequentArea,
			activityAreas: destinations,
			// You would store document URLs here after uploading to S3/R2
			// documents: documentUrls
		};

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

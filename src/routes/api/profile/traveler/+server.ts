import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { travelerProfiles, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '$lib/server/encryption';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || locals.user.role !== 'traveler') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		// Update phone number in users table if provided
		if (data.phone !== undefined) {
			const encryptedPhone = data.phone ? encrypt(data.phone) || data.phone : null;
			await db
				.update(users)
				.set({
					phone: encryptedPhone,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));
		}

		// Check if profile exists
		const existingProfile = await db
			.select()
			.from(travelerProfiles)
			.where(eq(travelerProfiles.userId, locals.user.id))
			.then((rows) => rows[0]);

		const profileData = {
			nationality: data.nationality || null,
			travelStyle: data.travelStyle || null,
			budgetRange: data.budgetRange || null,
			preferredLanguages: data.preferredLanguages || [],
			travelFrequency: data.travelFrequency || null,
			interests: data.interests || [],
			dietaryRestrictions: data.dietaryRestrictions || [],
			accessibilityNeeds: data.accessibilityNeeds || null,
			emergencyContact: data.emergencyContact || null,
			emergencyPhone: data.emergencyPhone || null,
			profileImageUrl: data.profileImageUrl || null,
			updatedAt: new Date()
		};

		if (existingProfile) {
			// Update existing profile
			await db
				.update(travelerProfiles)
				.set(profileData)
				.where(eq(travelerProfiles.userId, locals.user.id));
		} else {
			// Create new profile
			await db.insert(travelerProfiles).values({
				...profileData,
				userId: locals.user.id,
				createdAt: new Date()
			});
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating traveler profile:', error);
		return json({ error: 'Failed to update profile' }, { status: 500 });
	}
};

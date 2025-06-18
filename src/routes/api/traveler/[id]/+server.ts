import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, travelerProfiles } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		// Fetch user with traveler profile
		const result = await db
			.select()
			.from(users)
			.leftJoin(travelerProfiles, eq(users.id, travelerProfiles.userId))
			.where(and(eq(users.id, id), eq(users.role, 'traveler')))
			.then((rows) => rows[0]);

		if (!result || !result.users) {
			return json({ error: 'Traveler not found' }, { status: 404 });
		}

		// Return public traveler information
		return json({
			traveler: {
				id: result.users.id,
				name: result.users.name,
				createdAt: result.users.createdAt
			},
			travelerProfile: result.traveler_profiles
				? {
						nationality: result.traveler_profiles.nationality,
						travelStyle: result.traveler_profiles.travelStyle,
						budgetRange: result.traveler_profiles.budgetRange,
						preferredLanguages: result.traveler_profiles.preferredLanguages,
						travelFrequency: result.traveler_profiles.travelFrequency,
						interests: result.traveler_profiles.interests,
						dietaryRestrictions: result.traveler_profiles.dietaryRestrictions,
						accessibilityNeeds: result.traveler_profiles.accessibilityNeeds,
						profileImageUrl: result.traveler_profiles.profileImageUrl
				  }
				: null
		});
	} catch (error) {
		console.error('Error fetching traveler profile:', error);
		return json({ error: 'Failed to fetch profile' }, { status: 500 });
	}
};
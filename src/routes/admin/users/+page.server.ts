import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, guideProfiles, travelerProfiles, fileUploads } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Fetch all users with their profiles
	const allUsers = await db.select().from(users).orderBy(users.createdAt);

	// Separate users by role and fetch their profiles
	const travelers = [];
	const guides = [];
	const admins = [];

	for (const user of allUsers) {
		if (user.role === 'traveler') {
			const profile = await db.query.travelerProfiles.findFirst({
				where: eq(travelerProfiles.userId, user.id)
			});
			travelers.push({ ...user, profile });
		} else if (user.role === 'guide') {
			const profile = await db.query.guideProfiles.findFirst({
				where: eq(guideProfiles.userId, user.id)
			});
			const uploads = await db.query.fileUploads.findMany({
				where: eq(fileUploads.userId, user.id)
			});
			guides.push({ ...user, profile, uploads });
		} else if (user.role === 'admin') {
			// Admins might be former guides, so check for guide profile
			const profile = await db.query.guideProfiles.findFirst({
				where: eq(guideProfiles.userId, user.id)
			});
			admins.push({ ...user, profile });
		}
	}

	return {
		travelers,
		guides,
		admins,
		totalUsers: allUsers.length
	};
};

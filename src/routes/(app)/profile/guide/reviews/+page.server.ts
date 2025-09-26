import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';

export const load: PageServerLoad = async ({ locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw redirect(302, '/login');
	}

	// Fetch user info
	const user = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1)
		.then((rows) => rows[0]);

	if (!user) {
		throw redirect(302, '/login');
	}

	// Check if user is a guide
	if (user.role !== 'guide') {
		throw redirect(302, '/profile/traveler');
	}

	// Decrypt user fields before sending to client
	const decryptedUser = decryptUserFields(user);

	return {
		user: decryptedUser
	};
};
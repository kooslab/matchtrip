import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Update user's onboardingCompleted status
		await db
			.update(users)
			.set({
				onboardingCompleted: true,
				updatedAt: new Date()
			})
			.where(eq(users.id, locals.user.id));

		// Update the locals to reflect the change
		if (locals.user) {
			locals.user.onboardingCompleted = true;
		}

		return json({ success: true, message: 'Onboarding completed. Please refresh the page if you are not redirected.' });
	} catch (error) {
		console.error('Error completing onboarding:', error);
		return json({ error: 'Failed to complete onboarding' }, { status: 500 });
	}
};
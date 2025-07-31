import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals }) => {
	console.log('[API COMPLETE ONBOARDING] Request received');

	// Check if user is authenticated
	if (!locals.user) {
		console.error('[API COMPLETE ONBOARDING] No user in locals');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	console.log('[API COMPLETE ONBOARDING] User:', locals.user.email, 'ID:', locals.user.id);
	console.log(
		'[API COMPLETE ONBOARDING] Current onboardingCompleted status:',
		locals.user.onboardingCompleted
	);

	try {
		// Update user's onboardingCompleted status
		console.log('[API COMPLETE ONBOARDING] Updating database');
		const result = await db
			.update(users)
			.set({
				onboardingCompleted: true,
				updatedAt: new Date()
			})
			.where(eq(users.id, locals.user.id))
			.returning();

		console.log('[API COMPLETE ONBOARDING] Database update result:', result);

		// Update the locals to reflect the change
		if (locals.user) {
			locals.user.onboardingCompleted = true;
			console.log('[API COMPLETE ONBOARDING] Updated locals.user.onboardingCompleted to true');
		}

		// Verify the update
		const updatedUser = await db.query.users.findFirst({
			where: eq(users.id, locals.user.id),
			columns: {
				id: true,
				email: true,
				onboardingCompleted: true
			}
		});

		console.log('[API COMPLETE ONBOARDING] Verified user in DB:', updatedUser);

		return json({
			success: true,
			message: 'Onboarding completed. Please refresh the page if you are not redirected.',
			user: updatedUser
		});
	} catch (error) {
		console.error('[API COMPLETE ONBOARDING] Error completing onboarding:', error);
		return json({ error: 'Failed to complete onboarding' }, { status: 500 });
	}
};

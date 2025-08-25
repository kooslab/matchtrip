import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { notificationService } from '$lib/server/services/notificationService';
import { decrypt } from '$lib/server/encryption';

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

		// Fetch fresh user data from database to get the phone number that was just saved
		const freshUser = await db.query.users.findFirst({
			where: eq(users.id, locals.user.id),
			columns: {
				id: true,
				name: true,
				phone: true,
				email: true
			}
		});

		console.log('[API COMPLETE ONBOARDING] Fresh user data from DB:', {
			id: freshUser?.id,
			email: freshUser?.email,
			hasPhone: !!freshUser?.phone,
			hasName: !!freshUser?.name
		});

		// Send welcome AlimTalk notification (testcode21)
		if (freshUser?.phone) {
			try {
				console.log('[API COMPLETE ONBOARDING] Sending welcome AlimTalk notification');
				const decryptedPhone = decrypt(freshUser.phone);
				const decryptedName = freshUser.name ? decrypt(freshUser.name) : null;
				
				await notificationService.sendNotification({
					userId: freshUser.id,
					phoneNumber: decryptedPhone,
					templateCode: 'testcode21',
					templateData: {
						SHOPNAME: '매치트립',
						NAME: decryptedName || '고객'
					}
				});
				console.log('[API COMPLETE ONBOARDING] AlimTalk notification sent successfully');
			} catch (notificationError) {
				// Don't fail the onboarding if notification fails
				console.error(
					'[API COMPLETE ONBOARDING] Failed to send AlimTalk notification:',
					notificationError
				);
			}
		} else {
			console.log('[API COMPLETE ONBOARDING] No phone number found for user - AlimTalk notification not sent');
		}

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

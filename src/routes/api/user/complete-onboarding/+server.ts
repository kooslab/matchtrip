import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { notificationService } from '$lib/server/services/notificationService';
import { decrypt } from '$lib/server/encryption';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ locals }) => {
	console.log('========================================');
	console.log('[API COMPLETE ONBOARDING] Request received');
	console.log('[API COMPLETE ONBOARDING] Timestamp:', new Date().toISOString());
	console.log('[API COMPLETE ONBOARDING] Environment:', {
		NODE_ENV: process.env.NODE_ENV || 'development',
		hasInfobipKey: !!env.INFOBIP_API_KEY,
		hasInfobipUrl: !!env.INFOBIP_BASE_URL,
		hasKakaoKey: !!env.KAKAO_CHANNEL_PROFILE_KEY
	});

	// Check if user is authenticated
	if (!locals.user) {
		console.error('[API COMPLETE ONBOARDING] ❌ No user in locals');
		console.log('========================================');
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	console.log('[API COMPLETE ONBOARDING] User:', {
		email: locals.user.email,
		id: locals.user.id,
		role: locals.user.role,
		hasName: !!locals.user.name,
		hasPhone: !!locals.user.phone
	});
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

		// Fetch fresh user data from database to get the phone number and role that was just saved
		const freshUser = await db.query.users.findFirst({
			where: eq(users.id, locals.user.id),
			columns: {
				id: true,
				name: true,
				phone: true,
				email: true,
				role: true
			}
		});

		console.log('[API COMPLETE ONBOARDING] Fresh user data from DB:', {
			id: freshUser?.id,
			email: freshUser?.email,
			hasPhone: !!freshUser?.phone,
			hasName: !!freshUser?.name,
			role: freshUser?.role
		});

		// Send welcome AlimTalk notification based on user role
		console.log('[API COMPLETE ONBOARDING] === ALIMTALK SENDING SECTION ===');
		if (freshUser?.phone) {
			try {
				console.log('[API COMPLETE ONBOARDING] 📱 Phone found, preparing to send AlimTalk');
				const decryptedPhone = decrypt(freshUser.phone);
				const decryptedName = freshUser.name ? decrypt(freshUser.name) : null;
				
				console.log('[API COMPLETE ONBOARDING] Decrypted data:', {
					phoneLength: decryptedPhone?.length,
					phonePrefix: decryptedPhone?.substring(0, 4) + '***',
					hasName: !!decryptedName,
					nameLength: decryptedName?.length
				});

				// Determine template based on user role
				const templateName = freshUser.role === 'guide' ? 'signup_guide' : 'signup_traveler';
				const defaultName = freshUser.role === 'guide' ? '가이드' : '고객';

				console.log('[API COMPLETE ONBOARDING] Template selection:', {
					role: freshUser.role,
					templateName: templateName,
					finalName: decryptedName || defaultName
				});

				console.log('[API COMPLETE ONBOARDING] 🚀 Calling notificationService.sendNotification()...');
				const result = await notificationService.sendNotification({
					userId: freshUser.id,
					phoneNumber: decryptedPhone,
					templateName: templateName,
					templateData: {
						SHOPNAME: '매치트립',
						NAME: decryptedName || defaultName
					}
				});
				
				console.log('[API COMPLETE ONBOARDING] ✅ Notification result:', result);
				console.log('[API COMPLETE ONBOARDING] AlimTalk notification sent successfully');
			} catch (notificationError) {
				// Don't fail the onboarding if notification fails
				console.error(
					'[API COMPLETE ONBOARDING] ❌ Failed to send AlimTalk notification:',
					notificationError
				);
				console.error('[API COMPLETE ONBOARDING] Error stack:', 
					notificationError instanceof Error ? notificationError.stack : 'No stack trace'
				);
			}
		} else {
			console.log(
				'[API COMPLETE ONBOARDING] ⚠️ No phone number found for user - AlimTalk notification not sent'
			);
		}
		console.log('[API COMPLETE ONBOARDING] === END ALIMTALK SECTION ===');

		return json({
			success: true,
			message: 'Onboarding completed. Please refresh the page if you are not redirected.',
			user: updatedUser
		});
	} catch (error) {
		console.error('[API COMPLETE ONBOARDING] ❌ Error completing onboarding:', error);
		console.error('[API COMPLETE ONBOARDING] Error details:', {
			message: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : 'No stack trace'
		});
		console.log('========================================');
		return json({ error: 'Failed to complete onboarding' }, { status: 500 });
	}
};

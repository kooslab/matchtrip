import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers, trips, users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { notificationService } from '$lib/server/services/notificationService';
import { decrypt } from '$lib/server/encryption';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get session
		const session = await auth.api.getSession({
			headers: request.headers
		});

		if (!session) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		const { offerId, action } = await request.json();

		// Validate input
		if (!offerId || !action) {
			return json({ success: false, error: '필수 정보가 누락되었습니다.' }, { status: 400 });
		}

		if (!['accept', 'reject'].includes(action)) {
			return json({ success: false, error: '잘못된 액션입니다.' }, { status: 400 });
		}

		// Get offer details and verify ownership
		const offer = await db
			.select({
				id: offers.id,
				tripId: offers.tripId,
				travelerId: offers.travelerId,
				guideId: offers.guideId,
				status: offers.status
			})
			.from(offers)
			.where(eq(offers.id, offerId))
			.limit(1);

		if (offer.length === 0) {
			return json({ success: false, error: '제안을 찾을 수 없습니다.' }, { status: 404 });
		}

		// Verify that the current user is the traveler who owns this trip
		if (offer[0].travelerId !== session.user.id) {
			return json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
		}

		// Check if offer is still pending
		if (offer[0].status !== 'pending') {
			return json({ success: false, error: '이미 처리된 제안입니다.' }, { status: 400 });
		}

		const newStatus = action === 'accept' ? 'accepted' : 'rejected';

		// Update offer status
		await db.update(offers).set({ status: newStatus }).where(eq(offers.id, offerId));

		// If accepted, update trip status and reject other pending offers
		if (action === 'accept') {
			// Update trip status to accepted
			await db.update(trips).set({ status: 'accepted' }).where(eq(trips.id, offer[0].tripId));

			// Reject all other pending offers for this trip
			await db
				.update(offers)
				.set({ status: 'rejected' })
				.where(and(eq(offers.tripId, offer[0].tripId), eq(offers.status, 'pending')));

			// Send offer acceptance notification to guide (myoffers02)
			try {
				// Get guide and traveler details
				const [guideUser, travelerUser] = await Promise.all([
					db
						.select({ name: users.name, phone: users.phone })
						.from(users)
						.where(eq(users.id, offer[0].guideId))
						.limit(1),
					db
						.select({ name: users.name, phone: users.phone })
						.from(users)
						.where(eq(users.id, session.user.id))
						.limit(1)
				]);

				if (guideUser[0]?.phone) {
					console.log('[OFFERS ACTION] Sending offer acceptance AlimTalk to guide');
					const decryptedGuidePhone = decrypt(guideUser[0].phone);
					const decryptedGuideName = guideUser[0].name ? decrypt(guideUser[0].name) : null;
					const decryptedTravelerName = travelerUser[0]?.name
						? decrypt(travelerUser[0].name)
						: null;

					await notificationService.sendNotification({
						userId: offer[0].guideId,
						phoneNumber: decryptedGuidePhone,
						templateName: 'myoffers02',
						templateData: {
							SHOPNAME: '매치트립',
							고객: decryptedTravelerName || '고객',
							가이드: decryptedGuideName || '가이드',
							나의제안: '나의제안'
						}
					});
				}
			} catch (notificationError) {
				console.error('[OFFERS ACTION] Failed to send AlimTalk notification:', notificationError);
			}
		}

		return json({
			success: true,
			message: action === 'accept' ? '제안을 수락했습니다.' : '제안을 거절했습니다.'
		});
	} catch (error) {
		console.error('Error processing offer action:', error);
		return json({ success: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
	}
};

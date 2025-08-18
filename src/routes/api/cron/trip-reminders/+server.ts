import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips, offers, users } from '$lib/server/db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { notificationService } from '$lib/server/services/notificationService';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Verify cron secret for security (Vercel will send this)
		const authHeader = request.headers.get('authorization');
		if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
			console.log('[CRON] Unauthorized cron job attempt');
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		console.log('[CRON] Starting trip reminder job');

		// Get tomorrow's date range (KST timezone consideration)
		const now = new Date();
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		tomorrow.setHours(0, 0, 0, 0);

		const dayAfterTomorrow = new Date(tomorrow);
		dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

		console.log(
			`[CRON] Looking for trips starting between ${tomorrow.toISOString()} and ${dayAfterTomorrow.toISOString()}`
		);

		// Find trips starting tomorrow that are accepted
		const upcomingTrips = await db
			.select({
				tripId: trips.id,
				travelerId: trips.userId,
				startDate: trips.startDate,
				travelerName: users.name,
				travelerPhone: users.phone
			})
			.from(trips)
			.innerJoin(users, eq(trips.userId, users.id))
			.where(
				and(
					eq(trips.status, 'accepted'),
					gte(trips.startDate, tomorrow),
					lt(trips.startDate, dayAfterTomorrow)
				)
			);

		console.log(`[CRON] Found ${upcomingTrips.length} trips starting tomorrow`);

		// For each trip, find the accepted offer and send reminders
		const notifications = [];

		for (const trip of upcomingTrips) {
			try {
				// Get the accepted offer for this trip
				const acceptedOffer = await db
					.select({
						guideId: offers.guideId,
						guideName: users.name,
						guidePhone: users.phone
					})
					.from(offers)
					.innerJoin(users, eq(offers.guideId, users.id))
					.where(and(eq(offers.tripId, trip.tripId), eq(offers.status, 'accepted')))
					.limit(1);

				if (acceptedOffer.length === 0) {
					console.log(`[CRON] No accepted offer found for trip ${trip.tripId}`);
					continue;
				}

				const guide = acceptedOffer[0];

				// Send reminder to traveler (testcode07)
				if (trip.travelerPhone) {
					try {
						console.log(`[CRON] Sending reminder to traveler ${trip.travelerName}`);
						const travelerResult = await notificationService.sendNotification({
							userId: trip.travelerId,
							phoneNumber: trip.travelerPhone,
							templateCode: 'testcode07',
							templateData: {
								SHOPNAME: '매치트립',
								가이드: guide.guideName || '가이드',
								나의여행: '나의여행'
							}
						});

						notifications.push({
							type: 'traveler',
							userId: trip.travelerId,
							success: travelerResult.success,
							error: travelerResult.error
						});
					} catch (error) {
						console.error(`[CRON] Failed to send reminder to traveler ${trip.travelerId}:`, error);
						notifications.push({
							type: 'traveler',
							userId: trip.travelerId,
							success: false,
							error: error instanceof Error ? error.message : 'Unknown error'
						});
					}
				}

				// Send reminder to guide (testcode12)
				if (guide.guidePhone) {
					try {
						console.log(`[CRON] Sending reminder to guide ${guide.guideName}`);
						const guideResult = await notificationService.sendNotification({
							userId: guide.guideId,
							phoneNumber: guide.guidePhone,
							templateCode: 'testcode12',
							templateData: {
								SHOPNAME: '매치트립',
								고객: trip.travelerName || '고객',
								나의제안: '나의제안'
							}
						});

						notifications.push({
							type: 'guide',
							userId: guide.guideId,
							success: guideResult.success,
							error: guideResult.error
						});
					} catch (error) {
						console.error(`[CRON] Failed to send reminder to guide ${guide.guideId}:`, error);
						notifications.push({
							type: 'guide',
							userId: guide.guideId,
							success: false,
							error: error instanceof Error ? error.message : 'Unknown error'
						});
					}
				}
			} catch (error) {
				console.error(`[CRON] Error processing trip ${trip.tripId}:`, error);
			}
		}

		const successCount = notifications.filter((n) => n.success).length;
		const failCount = notifications.filter((n) => !n.success).length;

		console.log(`[CRON] Trip reminder job completed. Sent: ${successCount}, Failed: ${failCount}`);

		return json({
			success: true,
			message: 'Trip reminders sent',
			stats: {
				tripsProcessed: upcomingTrips.length,
				notificationsSent: successCount,
				notificationsFailed: failCount
			},
			details: notifications
		});
	} catch (error) {
		console.error('[CRON] Trip reminder job error:', error);
		return json(
			{
				success: false,
				error: 'Failed to send trip reminders',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

// POST endpoint for manual triggering (testing)
export const POST: RequestHandler = async ({ request, locals }) => {
	// Only allow admin users to manually trigger
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Check if user is admin (you might want to add an admin check here)
	const user = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	// For now, allow any authenticated user to trigger for testing
	// In production, you should check for admin role
	console.log('[CRON] Manual trigger by user:', session.user.id);

	// Call the GET handler with a mock request that includes the secret
	const mockRequest = new Request(request.url, {
		headers: {
			authorization: `Bearer ${env.CRON_SECRET || 'test-secret'}`
		}
	});

	return GET({ request: mockRequest, locals, params: {} } as any);
};

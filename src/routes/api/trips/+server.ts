import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { trips, destinations, offers, users, countries } from '$lib/server/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { auth } from '$lib/auth';
import { notificationService } from '$lib/server/services/notificationService';
import { decrypt } from '$lib/server/encryption';

export async function POST({ request, locals }) {
	try {
		const session = locals.session;

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const tripData = await request.json();

		// Validate required fields
		if (!tripData.destinationId) {
			return json({ error: 'Destination is required' }, { status: 400 });
		}

		// Insert trip with all new fields
		// Handle budget values - use values directly (already in KRW)
		const budgetMinValue = tripData.budgetMin || tripData.budget?.min || null;
		const budgetMaxValue = tripData.budgetMax || tripData.budget?.max || null;

		const [trip] = await db
			.insert(trips)
			.values({
				userId: session.user.id,
				destinationId: tripData.destinationId,
				startDate: new Date(tripData.startDate),
				endDate: new Date(tripData.endDate),
				adultsCount: tripData.adultsCount || 1,
				childrenCount: tripData.childrenCount || 0,
				babiesCount: tripData.babiesCount || 0,
				budgetMin: budgetMinValue,
				budgetMax: budgetMaxValue,
				travelStyle: tripData.travelStyle?.id || null,
				activities: tripData.activities || [],
				additionalRequest: tripData.additionalRequest || null,
				status: 'submitted'
			})
			.returning();

		// TODO: Handle file upload if present
		if (tripData.file) {
			// Upload file to S3/R2 and store URL
			console.log('File upload not yet implemented');
		}

		// Send trip registration notification (testcode23)
		try {
			// Get user details for notification
			const [user] = await db
				.select({ name: users.name, phone: users.phone })
				.from(users)
				.where(eq(users.id, session.user.id))
				.limit(1);

			if (user?.phone) {
				console.log('[TRIPS API] Sending trip registration AlimTalk notification');
				const decryptedPhone = decrypt(user.phone);
				const decryptedName = user.name ? decrypt(user.name) : null;

				await notificationService.sendNotification({
					userId: session.user.id,
					phoneNumber: decryptedPhone,
					templateName: 'mytrip01', // Correct template for trip registration
					templateData: {
						SHOPNAME: '매치트립',
						NAME: decryptedName || '고객'
					}
				});
				console.log('[TRIPS API] AlimTalk notification sent successfully');
			}
		} catch (notificationError) {
			// Don't fail the trip creation if notification fails
			console.error('[TRIPS API] Failed to send AlimTalk notification:', notificationError);
		}

		return json({ success: true, trip });
	} catch (error) {
		console.error('Error creating trip:', error);
		return json({ error: 'Failed to create trip' }, { status: 500 });
	}
}

export async function GET({ request }) {
	try {
		// Check authentication first
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return json({ success: false, error: '인증되지 않은 요청입니다.' }, { status: 401 });
		}

		// Fetch user's trips with destination information (simplified query)
		const userTrips = await db
			.select({
				id: trips.id,
				userId: trips.userId,
				adultsCount: trips.adultsCount,
				childrenCount: trips.childrenCount,
				startDate: trips.startDate,
				endDate: trips.endDate,
				travelMethod: trips.travelMethod,
				customRequest: trips.customRequest,
				status: trips.status,
				statusUpdatedAt: trips.statusUpdatedAt,
				createdAt: trips.createdAt,
				updatedAt: trips.updatedAt,
				destinationId: destinations.id,
				destinationCity: destinations.city,
				countryName: countries.name
			})
			.from(trips)
			.leftJoin(destinations, eq(trips.destinationId, destinations.id))
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.where(eq(trips.userId, session.user.id))
			.orderBy(desc(trips.createdAt));

		// Add offer count and restructure data
		const tripsWithOfferCount = await Promise.all(
			userTrips.map(async (trip) => {
				const offerCountResult = await db
					.select({ count: count(offers.id) })
					.from(offers)
					.where(eq(offers.tripId, trip.id));

				return {
					id: trip.id,
					userId: trip.userId,
					adultsCount: trip.adultsCount,
					childrenCount: trip.childrenCount,
					startDate: trip.startDate,
					endDate: trip.endDate,
					travelMethod: trip.travelMethod,
					customRequest: trip.customRequest,
					status: trip.status,
					statusUpdatedAt: trip.statusUpdatedAt,
					createdAt: trip.createdAt,
					updatedAt: trip.updatedAt,
					destination: trip.destinationId
						? {
								id: trip.destinationId,
								city: trip.destinationCity,
								country: trip.countryName
							}
						: null,
					offerCount: offerCountResult[0]?.count || 0
				};
			})
		);

		return json({ success: true, trips: tripsWithOfferCount });
	} catch (error) {
		console.error('Error fetching trips:', error);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
}

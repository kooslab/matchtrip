import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips, offers, users, destinations, reviews } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = locals.session;
		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { id: tripId } = params;

		// Get trip details
		const trip = await db.query.trips.findFirst({
			where: and(eq(trips.id, tripId), eq(trips.userId, session.user.id)),
			with: {
				destination: true,
				offers: {
					where: eq(offers.status, 'accepted'),
					limit: 1,
					with: {
						guide: {
							columns: {
								id: true,
								name: true,
								email: true,
								image: true
							}
						}
					}
				}
			}
		});

		if (!trip) {
			return json({ error: 'Trip not found or you are not the traveler' }, { status: 404 });
		}

		// Check if trip is completed
		if (trip.status !== 'completed') {
			return json({ error: 'You can only review completed trips' }, { status: 400 });
		}

		// Get accepted offer
		const acceptedOffer = trip.offers[0];
		if (!acceptedOffer) {
			return json({ error: 'No accepted offer found for this trip' }, { status: 404 });
		}

		// Check if review already exists
		const existingReview = await db.query.reviews.findFirst({
			where: and(eq(reviews.tripId, tripId), eq(reviews.travelerId, session.user.id))
		});

		if (existingReview && existingReview.content) {
			return json({ reviewExists: true });
		}

		return json({
			trip: {
				id: trip.id,
				startDate: trip.startDate,
				endDate: trip.endDate,
				status: trip.status
			},
			destination: trip.destination,
			offer: {
				id: acceptedOffer.id,
				title: acceptedOffer.title,
				description: acceptedOffer.description || ''
			},
			guide: acceptedOffer.guide
		});
	} catch (error) {
		console.error('Error fetching trip review info:', error);
		return json({ error: 'Failed to fetch trip information' }, { status: 500 });
	}
};

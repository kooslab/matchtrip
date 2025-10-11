import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { offers, users, guideProfiles } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = locals.session;

	// Check authentication
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const tripId = params.id;

	if (!tripId) {
		return json({ error: 'Trip ID is required' }, { status: 400 });
	}

	try {
		// Fetch all offers for this trip
		const tripOffers = await db
			.select({
				id: offers.id,
				guideId: offers.guideId,
				price: offers.price,
				title: offers.title,
				description: offers.description,
				itinerary: offers.itinerary,
				currency: offers.currency,
				duration: offers.duration,
				maxParticipants: offers.maxParticipants,
				status: offers.status,
				validUntil: offers.validUntil,
				createdAt: offers.createdAt,
				updatedAt: offers.updatedAt,
				guideUserId: users.id,
				guideName: users.name,
				guideEmail: users.email,
				guideImage: users.image,
				guideProfileImageUrl: guideProfiles.profileImageUrl
			})
			.from(offers)
			.innerJoin(users, eq(offers.guideId, users.id))
			.leftJoin(guideProfiles, eq(offers.guideId, guideProfiles.userId))
			.where(eq(offers.tripId, tripId))
			.orderBy(desc(offers.createdAt));

		// Decrypt guide names and restructure data
		const decryptedOffers = tripOffers.map((offer) => {
			const guide = {
				id: offer.guideUserId,
				name: offer.guideName,
				email: offer.guideEmail,
				image: offer.guideImage
			};

			const guideProfile = offer.guideProfileImageUrl
				? {
					profileImageUrl: offer.guideProfileImageUrl
				}
				: null;

			// Remove guide fields from offer object
			const { guideUserId, guideName, guideEmail, guideImage, guideProfileImageUrl, ...offerData } = offer;

			return {
				...offerData,
				guide: decryptUserFields(guide),
				guideProfile
			};
		});

		// Get metadata
		const lastUpdated = new Date().toISOString();
		const offerCount = decryptedOffers.length;
		const hasAcceptedOffer = decryptedOffers.some((offer) => offer.status === 'accepted');
		const pendingCount = decryptedOffers.filter((offer) => offer.status === 'pending').length;

		return json({
			offers: decryptedOffers,
			metadata: {
				count: offerCount,
				pendingCount,
				hasAcceptedOffer,
				lastUpdated,
				tripId
			}
		});
	} catch (error) {
		console.error('Error fetching offers:', error);
		return json({ error: 'Failed to fetch offers' }, { status: 500 });
	}
};

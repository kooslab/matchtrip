import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('[ADMIN OFFERS] Starting load function');
	// The admin check is already done in +layout.server.ts
	// We can access the user from parent layout data
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/');
	}

	try {
		// Use the query API which should handle relations properly
		const allOffers = await db.query.offers.findMany({
			orderBy: (offers, { desc }) => [desc(offers.createdAt)],
			with: {
				trip: {
					with: {
						user: true,
						destination: true
					}
				},
				guide: {
					with: {
						guideProfile: true
					}
				},
				payments: true
			}
		});

		// Transform the data to match expected format
		const transformedOffers = allOffers.map(offer => ({
			id: offer.id,
			price: offer.price,
			message: offer.message,
			status: offer.status,
			createdAt: offer.createdAt,
			updatedAt: offer.updatedAt,
			// Trip info
			tripId: offer.tripId,
			tripDestination: offer.trip?.destination?.city || 'Unknown',
			tripStartDate: offer.trip?.startDate || null,
			tripEndDate: offer.trip?.endDate || null,
			tripStatus: offer.trip?.status || 'unknown',
			tripPeople: offer.trip?.people || 0,
			// Traveler info
			travelerName: offer.trip?.user?.name || 'Unknown',
			travelerEmail: offer.trip?.user?.email || 'Unknown',
			// Guide info
			guideName: offer.guide?.name || 'Unknown',
			guideEmail: offer.guide?.email || 'Unknown',
			guideVerified: offer.guide?.guideProfile?.isVerified || false,
			// Payment status
			paymentStatus: offer.payments?.some(p => p.status === 'completed') ? 'paid' : 'unpaid'
		}));

		// Calculate statistics
		const stats = {
			total: transformedOffers.length,
			pending: transformedOffers.filter(o => o.status === 'pending').length,
			accepted: transformedOffers.filter(o => o.status === 'accepted').length,
			rejected: transformedOffers.filter(o => o.status === 'rejected').length,
			cancelled: transformedOffers.filter(o => o.status === 'cancelled').length,
			paid: transformedOffers.filter(o => o.paymentStatus === 'paid').length,
			totalRevenue: transformedOffers
				.filter(o => o.status === 'accepted' && o.paymentStatus === 'paid')
				.reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0)
		};

		return {
			offers: transformedOffers,
			stats
		};
	} catch (error) {
		console.error('Error loading offers:', error);
		// Return empty data structure on error
		return {
			offers: [],
			stats: {
				total: 0,
				pending: 0,
				accepted: 0,
				rejected: 0,
				cancelled: 0,
				paid: 0,
				totalRevenue: 0
			}
		};
	}
};
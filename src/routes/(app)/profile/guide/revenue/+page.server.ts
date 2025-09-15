import { db } from '$lib/server/db';
import { payments, products, offers, trips, users, productOffers, settlements } from '$lib/server/db/schema';
import { eq, desc, sql, isNotNull, and, gte, lte } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		throw redirect(302, '/auth/signin');
	}

	// Check if user is a guide
	if (user.role !== 'guide') {
		throw redirect(302, '/');
	}

	// Get filter parameters from URL
	const searchParams = url.searchParams;
	const settlementStatus = searchParams.get('settlementStatus') || 'all';
	const paymentStatus = searchParams.get('paymentStatus') || 'all';
	
	// Default to 3 months if no date range is specified
	const today = new Date();
	const threeMonthsAgo = new Date(today);
	threeMonthsAgo.setMonth(today.getMonth() - 3);
	
	const startDate = searchParams.get('startDate') || threeMonthsAgo.toISOString().split('T')[0];
	const endDate = searchParams.get('endDate') || today.toISOString().split('T')[0];

	try {
		console.log('Fetching payment data for guide:', user.id);

		// First, let's check what products this guide owns
		const guideProducts = await db
			.select({ id: products.id, title: products.title })
			.from(products)
			.where(eq(products.guideId, user.id));

		console.log(
			'Guide products:',
			guideProducts.length,
			guideProducts.map((p) => p.title)
		);

		// Build WHERE conditions for payments
		const paymentConditions = [eq(products.guideId, user.id)];
		
		if (paymentStatus !== 'all') {
			paymentConditions.push(eq(payments.status, paymentStatus));
		}
		
		if (startDate) {
			paymentConditions.push(gte(payments.createdAt, new Date(startDate)));
		}
		
		if (endDate) {
			const endDateTime = new Date(endDate);
			endDateTime.setHours(23, 59, 59, 999);
			paymentConditions.push(lte(payments.createdAt, endDateTime));
		}

		// Fetch all payments for products owned by this guide
		// Start from payments table and join with products to ensure we get all payments
		const productPayments = await db
			.select({
				id: payments.id,
				amount: payments.amount,
				currency: payments.currency,
				status: payments.status,
				paymentKey: payments.paymentKey,
				orderId: payments.orderId,
				paymentMethod: payments.paymentMethod,
				paidAt: payments.paidAt,
				createdAt: payments.createdAt,
				productId: products.id,
				productTitle: products.title,
				productOfferPrice: productOffers.price,
				buyerId: users.id,
				buyerName: users.name,
				buyerEmail: users.email,
				type: sql<string>`'product'`
			})
			.from(payments)
			.innerJoin(products, eq(payments.productId, products.id))
			.leftJoin(productOffers, eq(payments.productOfferId, productOffers.id))
			.leftJoin(users, eq(payments.userId, users.id))
			.where(and(...paymentConditions))
			.orderBy(desc(payments.createdAt));

		// Check what offers this guide has
		const guideOffers = await db
			.select({ id: offers.id, title: offers.title, status: offers.status })
			.from(offers)
			.where(eq(offers.guideId, user.id));

		console.log(
			'Guide offers:',
			guideOffers.length,
			guideOffers.map((o) => ({ title: o.title, status: o.status }))
		);

		// Build WHERE conditions for trip payments
		const tripPaymentConditions = [eq(offers.guideId, user.id)];
		
		if (paymentStatus !== 'all') {
			tripPaymentConditions.push(eq(payments.status, paymentStatus));
		}
		
		if (startDate) {
			tripPaymentConditions.push(gte(payments.createdAt, new Date(startDate)));
		}
		
		if (endDate) {
			const endDateTime = new Date(endDate);
			endDateTime.setHours(23, 59, 59, 999);
			tripPaymentConditions.push(lte(payments.createdAt, endDateTime));
		}

		// Fetch all payments for accepted offers by this guide
		// Start from payments table and join with offers to ensure we get all payments
		const tripPayments = await db
			.select({
				id: payments.id,
				amount: payments.amount,
				currency: payments.currency,
				status: payments.status,
				paymentKey: payments.paymentKey,
				orderId: payments.orderId,
				paymentMethod: payments.paymentMethod,
				paidAt: payments.paidAt,
				createdAt: payments.createdAt,
				offerId: offers.id,
				offerTitle: offers.title,
				offerPrice: offers.price,
				tripId: trips.id,
				buyerId: users.id,
				buyerName: users.name,
				buyerEmail: users.email,
				type: sql<string>`'trip'`
			})
			.from(payments)
			.innerJoin(offers, eq(payments.offerId, offers.id))
			.innerJoin(trips, eq(offers.tripId, trips.id))
			.leftJoin(users, eq(payments.userId, users.id))
			.where(and(...tripPaymentConditions))
			.orderBy(desc(payments.createdAt));

		console.log('Product payments found:', productPayments.length);
		console.log('Trip payments found:', tripPayments.length);

		// Combine and sort all payments
		const allPayments = [...productPayments, ...tripPayments].sort((a, b) => {
			const dateA = new Date(a.createdAt || 0).getTime();
			const dateB = new Date(b.createdAt || 0).getTime();
			return dateB - dateA;
		});

		// Calculate total revenue (only completed payments)
		const completedPayments = allPayments.filter((p) => p.status === 'completed');
		const totalRevenue = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

		console.log('All payments:', allPayments.length);
		console.log('Completed payments:', completedPayments.length);
		console.log('Total revenue:', totalRevenue);

		// Log sample payment for debugging
		if (allPayments.length > 0) {
			console.log('Sample payment:', {
				id: allPayments[0].id,
				amount: allPayments[0].amount,
				status: allPayments[0].status,
				type: allPayments[0].type
			});
		}

		// Group payments by month for display
		const paymentsByMonth = allPayments.reduce(
			(acc, payment) => {
				const date = new Date(payment.createdAt || 0);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

				if (!acc[monthKey]) {
					acc[monthKey] = {
						year: date.getFullYear(),
						month: date.getMonth() + 1,
						payments: [],
						totalAmount: 0
					};
				}

				acc[monthKey].payments.push(payment);
				if (payment.status === 'completed') {
					acc[monthKey].totalAmount += payment.amount || 0;
				}

				return acc;
			},
			{} as Record<string, any>
		);

		// Convert to array and sort by month
		const monthlyPayments = Object.values(paymentsByMonth).sort((a: any, b: any) => {
			if (a.year !== b.year) return b.year - a.year;
			return b.month - a.month;
		});

		// Build WHERE conditions for settlements
		const settlementConditions = [];
		
		// Base condition - guide's settlements
		settlementConditions.push(
			sql`(${offers.guideId} = ${user.id} OR ${products.guideId} = ${user.id})`
		);
		
		if (settlementStatus !== 'all') {
			settlementConditions.push(eq(settlements.status, settlementStatus));
		}
		
		if (startDate) {
			settlementConditions.push(gte(settlements.createdAt, new Date(startDate)));
		}
		
		if (endDate) {
			const endDateTime = new Date(endDate);
			endDateTime.setHours(23, 59, 59, 999);
			settlementConditions.push(lte(settlements.createdAt, endDateTime));
		}

		// Fetch settlements for this guide
		const guideSettlements = await db
			.select({
				id: settlements.id,
				paymentId: settlements.paymentId,
				commissionRate: settlements.commissionRate,
				commissionAmount: settlements.commissionAmount,
				taxRate: settlements.taxRate,
				taxAmount: settlements.taxAmount,
				settlementAmount: settlements.settlementAmount,
				status: settlements.status,
				settledAt: settlements.settledAt,
				bankTransferRef: settlements.bankTransferRef,
				notes: settlements.notes,
				createdAt: settlements.createdAt,
				updatedAt: settlements.updatedAt,
				// Payment details
				paymentAmount: payments.amount,
				paymentStatus: payments.status,
				paymentCreatedAt: payments.createdAt,
				orderId: payments.orderId,
				// Offer details  
				offerId: offers.id,
				offerTitle: offers.title,
				// Trip details
				tripId: trips.id,
				// Product details
				productId: products.id,
				productTitle: products.title,
				// Type determination
				type: sql<string>`CASE 
					WHEN ${payments.offerId} IS NOT NULL THEN 'trip'
					WHEN ${payments.productId} IS NOT NULL THEN 'product'
					ELSE 'unknown'
				END`
			})
			.from(settlements)
			.innerJoin(payments, eq(settlements.paymentId, payments.id))
			.leftJoin(offers, eq(payments.offerId, offers.id))
			.leftJoin(trips, eq(offers.tripId, trips.id))
			.leftJoin(products, eq(payments.productId, products.id))
			.where(and(...settlementConditions))
			.orderBy(desc(settlements.createdAt));

		console.log('Settlements found:', guideSettlements.length);

		// Group settlements by month
		const settlementsByMonth = guideSettlements.reduce(
			(acc, settlement) => {
				const date = new Date(settlement.createdAt || 0);
				const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

				if (!acc[monthKey]) {
					acc[monthKey] = {
						year: date.getFullYear(),
						month: date.getMonth() + 1,
						settlements: [],
						totalAmount: 0,
						pendingAmount: 0,
						completedAmount: 0
					};
				}

				acc[monthKey].settlements.push(settlement);
				acc[monthKey].totalAmount += settlement.settlementAmount || 0;
				
				if (settlement.status === 'pending') {
					acc[monthKey].pendingAmount += settlement.settlementAmount || 0;
				} else if (settlement.status === 'completed') {
					acc[monthKey].completedAmount += settlement.settlementAmount || 0;
				}

				return acc;
			},
			{} as Record<string, any>
		);

		// Convert to array and sort by month
		const monthlySettlements = Object.values(settlementsByMonth).sort((a: any, b: any) => {
			if (a.year !== b.year) return b.year - a.year;
			return b.month - a.month;
		});

		// Calculate total settlement amounts
		const totalPendingSettlement = guideSettlements
			.filter((s) => s.status === 'pending')
			.reduce((sum, s) => sum + (s.settlementAmount || 0), 0);
		
		const totalCompletedSettlement = guideSettlements
			.filter((s) => s.status === 'completed')
			.reduce((sum, s) => sum + (s.settlementAmount || 0), 0);

		return {
			payments: allPayments,
			monthlyPayments,
			totalRevenue,
			settlements: guideSettlements,
			monthlySettlements,
			totalPendingSettlement,
			totalCompletedSettlement,
			guide: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		};
	} catch (error) {
		console.error('Error fetching payment data:', error);
		return {
			payments: [],
			monthlyPayments: [],
			totalRevenue: 0,
			settlements: [],
			monthlySettlements: [],
			totalPendingSettlement: 0,
			totalCompletedSettlement: 0,
			guide: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		};
	}
};

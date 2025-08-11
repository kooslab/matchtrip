import { db } from '$lib/server/db';
import { payments, products, offers, trips, users, productOffers } from '$lib/server/db/schema';
import { eq, desc, sql, isNotNull } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session || !user) {
		throw redirect(302, '/auth/signin');
	}

	// Check if user is a guide
	if (user.role !== 'guide') {
		throw redirect(302, '/');
	}

	try {
		console.log('Fetching payment data for guide:', user.id);
		
		// First, let's check what products this guide owns
		const guideProducts = await db
			.select({ id: products.id, title: products.title })
			.from(products)
			.where(eq(products.guideId, user.id));
		
		console.log('Guide products:', guideProducts.length, guideProducts.map(p => p.title));
		
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
			.where(eq(products.guideId, user.id))
			.orderBy(desc(payments.createdAt));

		// Check what offers this guide has
		const guideOffers = await db
			.select({ id: offers.id, title: offers.title, status: offers.status })
			.from(offers)
			.where(eq(offers.guideId, user.id));
		
		console.log('Guide offers:', guideOffers.length, guideOffers.map(o => ({ title: o.title, status: o.status })));
		
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
			.where(eq(offers.guideId, user.id))
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
		const completedPayments = allPayments.filter(p => p.status === 'completed');
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
		const paymentsByMonth = allPayments.reduce((acc, payment) => {
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
		}, {} as Record<string, any>);

		// Convert to array and sort by month
		const monthlyPayments = Object.values(paymentsByMonth).sort((a: any, b: any) => {
			if (a.year !== b.year) return b.year - a.year;
			return b.month - a.month;
		});

		return {
			payments: allPayments,
			monthlyPayments,
			totalRevenue,
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
			guide: {
				id: user.id,
				name: user.name,
				email: user.email
			}
		};
	}
};
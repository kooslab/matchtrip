import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, trips, offers, destinations, guideProfiles, payments } from '$lib/server/db/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Get user statistics
	const userStats = await db
		.select({
			role: users.role,
			count: sql<number>`count(*)::int`
		})
		.from(users)
		.groupBy(users.role);

	const userCounts = {
		total: 0,
		travelers: 0,
		guides: 0,
		admins: 0
	};

	userStats.forEach((stat) => {
		userCounts.total += stat.count;
		if (stat.role === 'traveler') userCounts.travelers = stat.count;
		else if (stat.role === 'guide') userCounts.guides = stat.count;
		else if (stat.role === 'admin') userCounts.admins = stat.count;
	});

	// Get verified guides count
	const verifiedGuidesResult = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(guideProfiles)
		.where(eq(guideProfiles.isVerified, true));

	const verifiedGuides = verifiedGuidesResult[0]?.count || 0;

	// Get trip statistics
	const tripStats = await db
		.select({
			status: trips.status,
			count: sql<number>`count(*)::int`
		})
		.from(trips)
		.groupBy(trips.status);

	const tripCounts = {
		total: 0,
		draft: 0,
		submitted: 0,
		accepted: 0,
		completed: 0,
		cancelled: 0
	};

	tripStats.forEach((stat) => {
		tripCounts.total += stat.count;
		tripCounts[stat.status] = stat.count;
	});

	// Get offer statistics
	const offerStats = await db
		.select({
			status: offers.status,
			count: sql<number>`count(*)::int`
		})
		.from(offers)
		.groupBy(offers.status);

	const offerCounts = {
		total: 0,
		pending: 0,
		accepted: 0,
		rejected: 0,
		cancelled: 0,
		withdrawn: 0
	};

	offerStats.forEach((stat) => {
		offerCounts.total += stat.count;
		offerCounts[stat.status] = stat.count;
	});

	// Get destination count
	const destinationResult = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(destinations);

	const destinationCount = destinationResult[0]?.count || 0;

	// Get recent activity (last 30 days)
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	// New users in last 30 days
	const newUsersResult = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(users)
		.where(gte(users.createdAt, thirtyDaysAgo));

	const newUsers = newUsersResult[0]?.count || 0;

	// New trips in last 30 days
	const newTripsResult = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(trips)
		.where(gte(trips.createdAt, thirtyDaysAgo));

	const newTrips = newTripsResult[0]?.count || 0;

	// Payment statistics
	const paymentStats = await db
		.select({
			status: payments.status,
			totalAmount: sql<number>`sum(amount)::int`
		})
		.from(payments)
		.groupBy(payments.status);

	const paymentCounts = {
		totalRevenue: 0,
		pending: 0,
		completed: 0,
		failed: 0
	};

	paymentStats.forEach((stat) => {
		if (stat.status === 'completed') {
			paymentCounts.completed = stat.totalAmount || 0;
			paymentCounts.totalRevenue = stat.totalAmount || 0;
		} else if (stat.status === 'pending') {
			paymentCounts.pending = stat.totalAmount || 0;
		} else if (stat.status === 'failed') {
			paymentCounts.failed = stat.totalAmount || 0;
		}
	});

	// Get recent users for activity feed
	const recentUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt
		})
		.from(users)
		.orderBy(users.createdAt)
		.limit(5);

	// Get recent trips for activity feed
	const recentTrips = await db
		.select({
			id: trips.id,
			status: trips.status,
			createdAt: trips.createdAt,
			destination: destinations.city,
			travelerName: users.name
		})
		.from(trips)
		.leftJoin(destinations, eq(trips.destinationId, destinations.id))
		.leftJoin(users, eq(trips.userId, users.id))
		.orderBy(trips.createdAt)
		.limit(5);

	return {
		stats: {
			users: userCounts,
			verifiedGuides,
			trips: tripCounts,
			offers: offerCounts,
			destinations: destinationCount,
			newUsers,
			newTrips,
			payments: paymentCounts
		},
		recentActivity: {
			users: recentUsers,
			trips: recentTrips
		}
	};
};

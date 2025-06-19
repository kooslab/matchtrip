import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { trips, users } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is admin
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Unauthorized');
	}

	try {
		// Fetch all trips with traveler info
		const allTrips = await db
			.select({
				id: trips.id,
				destination: trips.destination,
				startDate: trips.startDate,
				endDate: trips.endDate,
				status: trips.status,
				people: trips.people,
				tourType: trips.tourType,
				budget: trips.budget,
				createdAt: trips.createdAt,
				updatedAt: trips.updatedAt,
				travelerName: users.name,
				travelerEmail: users.email
			})
			.from(trips)
			.leftJoin(users, eq(trips.userId, users.id))
			.orderBy(desc(trips.createdAt));

		// Create CSV content
		const headers = [
			'ID',
			'Destination',
			'Start Date',
			'End Date',
			'Status',
			'People',
			'Tour Type',
			'Budget',
			'Traveler Name',
			'Traveler Email',
			'Created At',
			'Updated At'
		];

		const rows = allTrips.map(trip => [
			trip.id,
			trip.destination || '',
			trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : '',
			trip.endDate ? new Date(trip.endDate).toISOString().split('T')[0] : '',
			trip.status,
			trip.people?.toString() || '0',
			trip.tourType || '',
			trip.budget?.toString() || '',
			trip.travelerName || '',
			trip.travelerEmail || '',
			new Date(trip.createdAt).toISOString(),
			new Date(trip.updatedAt).toISOString()
		]);

		// Convert to CSV format
		const csvContent = [
			headers.join(','),
			...rows.map(row => 
				row.map(cell => {
					// Escape quotes and wrap in quotes if contains comma
					const escaped = cell.replace(/"/g, '""');
					return escaped.includes(',') ? `"${escaped}"` : escaped;
				}).join(',')
			)
		].join('\n');

		// Return as downloadable file
		return new Response(csvContent, {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': `attachment; filename="trips-${new Date().toISOString().split('T')[0]}.csv"`
			}
		});
	} catch (err) {
		console.error('Error exporting trips:', err);
		throw error(500, 'Failed to export trips');
	}
};
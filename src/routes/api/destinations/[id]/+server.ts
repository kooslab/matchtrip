import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { destinations, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';

export const PUT: RequestHandler = async ({ params, request }) => {
	// Check if user is admin
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Fetch user role from database
	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: { role: true }
	});

	if (!user || user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid destination ID' }, { status: 400 });
	}

	try {
		const { city, country, imageUrl } = await request.json();

		if (!city || !country) {
			return json({ error: 'City and country are required' }, { status: 400 });
		}

		const [updatedDestination] = await db
			.update(destinations)
			.set({
				city,
				country,
				imageUrl,
				updated_at: new Date()
			})
			.where(eq(destinations.id, id))
			.returning();

		if (!updatedDestination) {
			return json({ error: 'Destination not found' }, { status: 404 });
		}

		return json(updatedDestination);
	} catch (error: any) {
		console.error('Error updating destination:', error);
		
		// Handle unique constraint violation
		if (error.code === '23505' && error.constraint === 'destinations_city_unique') {
			return json({ error: 'A destination with this city already exists' }, { status: 409 });
		}
		
		return json({ error: 'Failed to update destination' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ params, request }) => {
	// Check if user is admin
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Fetch user role from database
	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: { role: true }
	});

	if (!user || user.role !== 'admin') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const id = parseInt(params.id);
	if (isNaN(id)) {
		return json({ error: 'Invalid destination ID' }, { status: 400 });
	}

	try {
		const [deletedDestination] = await db
			.delete(destinations)
			.where(eq(destinations.id, id))
			.returning();

		if (!deletedDestination) {
			return json({ error: 'Destination not found' }, { status: 404 });
		}

		return json({ success: true });
	} catch (error: any) {
		console.error('Error deleting destination:', error);
		
		// Handle foreign key constraint
		if (error.code === '23503') {
			return json({ error: 'Cannot delete destination that has associated trips' }, { status: 409 });
		}
		
		return json({ error: 'Failed to delete destination' }, { status: 500 });
	}
};
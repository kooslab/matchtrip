import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const updates = await request.json();
		const allowedFields = ['name', 'phone', 'birthDate'];
		
		// Filter out any fields that aren't allowed
		const filteredUpdates: Record<string, any> = {};
		for (const field of allowedFields) {
			if (field in updates) {
				filteredUpdates[field] = updates[field];
			}
		}

		// Validate name if provided
		if ('name' in filteredUpdates) {
			const name = filteredUpdates.name?.trim();
			if (!name || name.length < 2) {
				return json({ error: 'Name must be at least 2 characters long' }, { status: 400 });
			}
			filteredUpdates.name = name;
		}

		// Validate phone if provided
		if ('phone' in filteredUpdates) {
			// Remove all non-numeric characters
			const phone = filteredUpdates.phone?.replace(/\D/g, '');
			if (!phone || phone.length < 10 || phone.length > 11) {
				return json({ error: 'Invalid phone number format' }, { status: 400 });
			}
			filteredUpdates.phone = phone;
		}

		// Validate birthDate if provided
		if ('birthDate' in filteredUpdates) {
			const birthDate = new Date(filteredUpdates.birthDate);
			const now = new Date();
			const age = now.getFullYear() - birthDate.getFullYear();
			
			// Check if date is valid
			if (isNaN(birthDate.getTime())) {
				return json({ error: 'Invalid birth date format' }, { status: 400 });
			}
			
			// Check minimum age (14 years)
			if (age < 14) {
				return json({ error: 'You must be at least 14 years old' }, { status: 400 });
			}
			
			// Check maximum age (100 years)
			if (age > 100) {
				return json({ error: 'Invalid birth date' }, { status: 400 });
			}
			
			filteredUpdates.birthDate = filteredUpdates.birthDate;
		}

		// Update user
		if (Object.keys(filteredUpdates).length > 0) {
			await db
				.update(users)
				.set({
					...filteredUpdates,
					updatedAt: new Date()
				})
				.where(eq(users.id, locals.user.id));
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating user profile:', error);
		return json({ error: 'Failed to update profile' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const user = await db.query.users.findFirst({
			where: eq(users.id, locals.user.id),
			columns: {
				id: true,
				name: true,
				email: true,
				phone: true,
				role: true,
				image: true,
				emailVerified: true
			}
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ user });
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return json({ error: 'Failed to fetch profile' }, { status: 500 });
	}
};
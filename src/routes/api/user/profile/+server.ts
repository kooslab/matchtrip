import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt, decryptUserFields } from '$lib/server/encryption';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const updates = await request.json();
		const allowedFields = ['name', 'phone', 'countryCode', 'birthDate', 'image'];

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
			// Encrypt name before storing
			filteredUpdates.name = encrypt(name);
		}

		// Validate phone if provided (phone should NOT include country code)
		if ('phone' in filteredUpdates) {
			const phone = filteredUpdates.phone?.trim();
			const digitsOnly = phone?.replace(/\D/g, '');

			// Phone number validation (7-15 digits, ITU-T E.164 standard)
			if (!digitsOnly || digitsOnly.length < 7 || digitsOnly.length > 15) {
				return json({ error: 'Invalid phone number format' }, { status: 400 });
			}

			// Encrypt phone before storing
			filteredUpdates.phone = encrypt(digitsOnly);
		}

		// Validate countryCode if provided
		if ('countryCode' in filteredUpdates) {
			const countryCode = filteredUpdates.countryCode?.trim();

			// Country code must start with + and have 1-4 digits
			if (!countryCode || !countryCode.match(/^\+\d{1,4}$/)) {
				return json({ error: 'Invalid country code format' }, { status: 400 });
			}

			filteredUpdates.countryCode = countryCode;
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
				countryCode: true,
				role: true,
				image: true,
				emailVerified: true
			}
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Decrypt user fields before sending
		const decryptedUser = decryptUserFields(user);

		return json({ user: decryptedUser });
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return json({ error: 'Failed to fetch profile' }, { status: 500 });
	}
};

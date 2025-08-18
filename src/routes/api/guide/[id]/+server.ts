import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { id } = params;

		if (!id) {
			return json({ error: 'Guide ID is required' }, { status: 400 });
		}

		// Fetch guide with profile information
		const guide = await db.query.users.findFirst({
			where: eq(users.id, id),
			columns: {
				id: true,
				name: true,
				email: true,
				image: true,
				role: true,
				createdAt: true
			},
			with: {
				guideProfile: true
			}
		});

		if (!guide || guide.role !== 'guide') {
			return json({ error: 'Guide not found' }, { status: 404 });
		}

		// Decrypt user fields before returning
		const decryptedGuide = decryptUserFields(guide);

		// Return guide data with profile
		return json({
			id: decryptedGuide.id,
			name: decryptedGuide.name,
			email: decryptedGuide.email,
			image: decryptedGuide.image,
			createdAt: decryptedGuide.createdAt,
			profile: decryptedGuide.guideProfile
		});
	} catch (error) {
		console.error('Error fetching guide profile:', error);
		return json({ error: 'Failed to fetch guide profile' }, { status: 500 });
	}
};

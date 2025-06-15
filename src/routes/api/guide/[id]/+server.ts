import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

		// Return guide data with profile
		return json({
			id: guide.id,
			name: guide.name,
			email: guide.email,
			image: guide.image,
			createdAt: guide.createdAt,
			profile: guide.guideProfile
		});
	} catch (error) {
		console.error('Error fetching guide profile:', error);
		return json({ error: 'Failed to fetch guide profile' }, { status: 500 });
	}
};
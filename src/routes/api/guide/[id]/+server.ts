import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';
import { transformImageUrl } from '$lib/utils/imageUrl';

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

		// Transform profile image URL if it exists
		if (decryptedGuide.guideProfile?.profileImageUrl) {
			const imageUrl = decryptedGuide.guideProfile.profileImageUrl;
			// Check if it's a relative path or already has full path
			if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/api/images/')) {
				// Check if it already includes the folder path
				if (imageUrl.startsWith('guide-profile/')) {
					// Already has the folder, just add the API prefix
					decryptedGuide.guideProfile.profileImageUrl = `/api/images/${imageUrl}`;
				} else {
					// Just a filename, add the full path
					decryptedGuide.guideProfile.profileImageUrl = `/api/images/guide-profile/${imageUrl}`;
				}
			} else {
				// Transform existing URL (for OAuth images, etc.)
				decryptedGuide.guideProfile.profileImageUrl = transformImageUrl(imageUrl);
			}
		}

		// Transform user image URL if it exists
		if (decryptedGuide.image) {
			decryptedGuide.image = transformImageUrl(decryptedGuide.image);
		}

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

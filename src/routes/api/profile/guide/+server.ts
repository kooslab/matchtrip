import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
	}

	let introduction;
	let profileImageUrl;
	try {
		const body = await request.json();
		introduction = body.introduction;
		profileImageUrl = body.profileImageUrl;
		if (typeof introduction !== 'string') {
			return new Response(JSON.stringify({ success: false, error: 'Invalid introduction' }), {
				status: 400
			});
		}
		if (profileImageUrl !== undefined && typeof profileImageUrl !== 'string') {
			return new Response(JSON.stringify({ success: false, error: 'Invalid profile image URL' }), {
				status: 400
			});
		}
	} catch {
		return new Response(JSON.stringify({ success: false, error: 'Invalid request' }), {
			status: 400
		});
	}

	try {
		// Update the guide profile introduction and image
		const updateData: any = { introduction };
		if (profileImageUrl !== undefined) {
			updateData.profileImageUrl = profileImageUrl;
		}
		
		const result = await db
			.update(guideProfiles)
			.set(updateData)
			.where(eq(guideProfiles.userId, userId));
		return new Response(JSON.stringify({ success: true }));
	} catch (err) {
		return new Response(JSON.stringify({ success: false, error: 'DB error' }), { status: 500 });
	}
};

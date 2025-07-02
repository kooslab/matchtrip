import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.session?.user?.id) {
		return json({ error: '인증이 필요합니다.' }, { status: 401 });
	}
	
	// TEMPORARY: Allow role changes for testing onboarding flow
	// Uncomment this block when onboarding flow is complete
	/*
	// Check if user already has a role
	if (locals.user?.role) {
		return json({ error: '이미 역할이 설정되어 있습니다.' }, { status: 400 });
	}
	*/
	
	try {
		const { role } = await request.json();
		
		// Validate role
		if (!['traveler', 'guide'].includes(role)) {
			return json({ error: '유효하지 않은 역할입니다.' }, { status: 400 });
		}
		
		// Update user role
		await db
			.update(users)
			.set({ role })
			.where(eq(users.id, locals.session.user.id));
		
		return json({ success: true });
	} catch (error) {
		console.error('Error setting user role:', error);
		return json({ error: '역할 설정에 실패했습니다.' }, { status: 500 });
	}
};
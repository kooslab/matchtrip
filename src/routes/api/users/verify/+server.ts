import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, guideProfiles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

export const PUT: RequestHandler = async ({ request }) => {
	// Check if user is admin
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		return json({ error: '인증되지 않았습니다' }, { status: 401 });
	}

	// Fetch user role from database
	const currentUser = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: { role: true }
	});

	if (!currentUser || currentUser.role !== 'admin') {
		return json({ error: '권한이 없습니다' }, { status: 403 });
	}

	try {
		const { userId, isVerified } = await request.json();

		if (!userId || typeof isVerified !== 'boolean') {
			return json({ error: '사용자 ID와 인증 상태가 필요합니다' }, { status: 400 });
		}

		// Update guide verification status
		const [updatedProfile] = await db
			.update(guideProfiles)
			.set({ 
				isVerified,
				verifiedAt: isVerified ? new Date() : null,
				updatedAt: new Date()
			})
			.where(eq(guideProfiles.userId, userId))
			.returning();

		if (!updatedProfile) {
			return json({ error: '가이드 프로필을 찾을 수 없습니다' }, { status: 404 });
		}

		return json({ 
			success: true, 
			profile: updatedProfile
		});
	} catch (error) {
		console.error('Error updating verification status:', error);
		return json({ error: '인증 상태 업데이트에 실패했습니다' }, { status: 500 });
	}
};
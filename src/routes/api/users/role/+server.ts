import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
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
		const { userId, role } = await request.json();

		if (!userId || !role) {
			return json({ error: '사용자 ID와 역할이 필요합니다' }, { status: 400 });
		}

		// Validate role
		if (!['admin', 'guide', 'traveler'].includes(role)) {
			return json({ error: '유효하지 않은 역할입니다' }, { status: 400 });
		}

		// Don't allow admin to remove their own admin role
		if (userId === session.user.id && role !== 'admin') {
			return json({ error: '자신의 관리자 권한은 제거할 수 없습니다' }, { status: 400 });
		}

		// Update user role
		const [updatedUser] = await db
			.update(users)
			.set({ 
				role: role as 'admin' | 'guide' | 'traveler',
				updatedAt: new Date()
			})
			.where(eq(users.id, userId))
			.returning();

		if (!updatedUser) {
			return json({ error: '사용자를 찾을 수 없습니다' }, { status: 404 });
		}

		return json({ 
			success: true, 
			user: {
				id: updatedUser.id,
				name: updatedUser.name,
				email: updatedUser.email,
				role: updatedUser.role
			}
		});
	} catch (error) {
		console.error('Error updating user role:', error);
		return json({ error: '역할 업데이트에 실패했습니다' }, { status: 500 });
	}
};
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, sessions, accounts, userDeletions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '$lib/server/encryption';

export const POST: RequestHandler = async ({ locals, cookies, request }) => {
	try {
		// Check if user is authenticated
		const session = locals.session;
		const user = locals.user;

		if (!session || !user) {
			return json({ error: 'Unauthorized', message: '로그인이 필요합니다.' }, { status: 401 });
		}

		const userId = user.id;

		// Get request body
		const body = await request.json();
		const { reason, details } = body;

		if (!reason) {
			return json({ error: 'Bad Request', message: '탈퇴 사유를 선택해주세요.' }, { status: 400 });
		}

		// Get current user data before deletion (for logging)
		const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (!currentUser || currentUser.length === 0) {
			return json({ error: 'Not Found', message: '사용자를 찾을 수 없습니다.' }, { status: 404 });
		}

		const userData = currentUser[0];

		// Decrypt sensitive data for logging
		const originalEmail = userData.email; // Email is NOT encrypted
		const originalName = userData.name ? decrypt(userData.name) : null;
		const originalPhone = userData.phone ? decrypt(userData.phone) : null;

		// Begin transaction for atomic deletion
		await db.transaction(async (tx) => {
			// 1. Log deletion to user_deletions table
			await tx.insert(userDeletions).values({
				userId: userId,
				originalEmail: originalEmail,
				originalName: originalName,
				originalPhone: originalPhone,
				userRole: userData.role || 'unknown',
				reason: reason,
				details: details || null,
				deletedAt: new Date(),
				createdAt: new Date()
			});

			// 2. Delete all user sessions
			await tx.delete(sessions).where(eq(sessions.userId, userId));

			// 3. Delete OAuth accounts (allows re-registration with same email)
			await tx.delete(accounts).where(eq(accounts.userId, userId));

			// 4. Anonymize user data (soft delete)
			await tx
				.update(users)
				.set({
					isDeleted: true,
					email: `deleted_${userId}@deleted.com`,
					emailHash: null,
					role: null,
					onboardingCompleted: false,
					deletedAt: new Date(),
					updatedAt: new Date()
				})
				.where(eq(users.id, userId));
		});

		// Clear the user's session cookie
		cookies.delete('better-auth.session_token', { path: '/' });

		return json({
			success: true,
			message: '계정이 성공적으로 삭제되었습니다.'
		});
	} catch (error) {
		console.error('Error deleting user account:', error);
		return json(
			{
				error: 'Internal Server Error',
				message: '계정 삭제 중 오류가 발생했습니다.'
			},
			{ status: 500 }
		);
	}
};

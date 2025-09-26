import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { encrypt } from '$lib/server/encryption';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;

	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { name, phone } = await request.json();

		if (!name || !phone) {
			return json({ error: '이름과 전화번호는 필수입니다.' }, { status: 400 });
		}

		// Update user information (encrypt sensitive fields)
		await db
			.update(users)
			.set({
				name: encrypt(name),
				phone: encrypt(phone),
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));

		return json({ success: true, message: '회원 정보가 업데이트되었습니다.' });
	} catch (error) {
		console.error('Error updating account:', error);
		return json({ error: '회원 정보 업데이트에 실패했습니다.' }, { status: 500 });
	}
};
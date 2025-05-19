import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

export async function GET({ url, request }) {
	// 1. 현재 세션 확인 (로그인 여부)
	const session = await auth.api.getSession({ headers: request.headers });

	if (!session) {
		return json({ success: false, error: '인증되지 않은 요청입니다.' }, { status: 401 });
	}

	// 2. 요청된 userId 확인
	const requestedUserId = url.searchParams.get('userId');

	if (!requestedUserId) {
		return json({ success: false, error: 'userId is required' }, { status: 400 });
	}

	// 3. 본인 데이터만 접근 가능하도록 확인
	if (session.user.id !== requestedUserId) {
		return json({ success: false, error: '권한이 없습니다.' }, { status: 403 });
	}

	// 4. 본인 확인 후 역할 정보 조회
	const user = await db.query.users.findFirst({
		where: eq(users.id, requestedUserId)
	});

	if (!user) {
		return json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
	}

	return json({ success: true, role: user.role });
}

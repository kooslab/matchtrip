import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CancellationService } from '$lib/server/services/cancellation';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	try {
		const user = locals.user;
		const session = locals.session;

		if (!session || !user) {
			return json({ success: false, error: '로그인이 필요합니다.' }, { status: 401 });
		}

		// Check if user is admin
		if (user.role !== 'admin') {
			return json({ success: false, error: '관리자 권한이 필요합니다.' }, { status: 403 });
		}

		const { id: requestId } = params;
		const body = await request.json();
		const { adminNotes } = body;

		if (!adminNotes || adminNotes.trim() === '') {
			return json({ success: false, error: '거절 사유를 입력해주세요.' }, { status: 400 });
		}

		const cancellationService = new CancellationService();

		// Process rejection
		await cancellationService.processCancellation({
			requestId,
			adminUser: user,
			decision: 'rejected',
			adminNotes
		});

		return json({
			success: true,
			message: '취소 요청이 거절되었습니다.'
		});
	} catch (error) {
		console.error('Error rejecting cancellation:', error);

		if (error instanceof Error) {
			return json({ success: false, error: error.message }, { status: 400 });
		}

		return json({ success: false, error: '거절 처리 중 오류가 발생했습니다.' }, { status: 500 });
	}
};

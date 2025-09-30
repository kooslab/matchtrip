import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [event] = await db.select().from(events).where(eq(events.slug, params.slug)).limit(1);

		if (!event) {
			throw error(404, '이벤트를 찾을 수 없습니다');
		}

		if (!event.isActive) {
			throw error(404, '이벤트가 종료되었습니다');
		}

		return {
			event
		};
	} catch (err) {
		console.error('Error loading event:', err);
		throw error(500, '이벤트를 불러오는 중 오류가 발생했습니다');
	}
};
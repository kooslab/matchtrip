import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth();
	if (!session?.user) {
		throw redirect(302, '/signin');
	}

	// Check if user is admin
	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: { role: true }
	});

	if (!user || user.role !== 'admin') {
		throw redirect(302, '/');
	}

	return {};
};
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ request }) => {
	console.log('[ADMIN LAYOUT] Starting load function');
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session?.user) {
		throw redirect(303, '/');
	}

	console.log('[ADMIN LAYOUT] Fetching user from database');
	// Fetch user with role from database
	const user = await db.query.users.findFirst({
		where: eq(users.id, session.user.id),
		columns: {
			id: true,
			name: true,
			email: true,
			role: true
		}
	});

	if (!user || user.role !== 'admin') {
		throw redirect(303, '/');
	}

	console.log('[ADMIN LAYOUT] Returning user data');
	return {
		user
	};
};
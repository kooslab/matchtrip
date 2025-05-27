import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ request, locals }) => {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	console.log('Layout server - Session exists:', !!session, 'User ID:', session?.user?.id);

	let userRole = null;
	let fullUser = null;

	// If user is logged in, fetch their role and cache it
	if (session?.user?.id) {
		try {
			const user = await db.query.users.findFirst({
				where: eq(users.id, session.user.id),
				columns: {
					id: true,
					role: true,
					name: true,
					email: true
				}
			});

			if (user) {
				userRole = user.role;
				fullUser = user;
				// Cache user data in locals for other server functions to use
				locals.user = user;
				locals.session = session;
				console.log('Layout server - User cached in locals:', user.email, user.role);
			}
		} catch (error) {
			console.error('Failed to fetch user role:', error);
		}
	} else {
		console.log('Layout server - No session found');
	}

	return {
		user: session?.user ?? null,
		session: session?.session ?? null,
		userRole,
		fullUser
	};
};

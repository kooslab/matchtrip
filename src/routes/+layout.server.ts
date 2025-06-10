import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ request, locals }) => {
	try {
		const session = await auth.api.getSession({
			headers: request.headers
		});

		console.log('Layout server - Session exists:', !!session, 'User ID:', session?.user?.id);

		let userRole = null;
		let fullUser = null;

		// If user is logged in, fetch their role and cache it
		if (session?.user?.id) {
			try {
				console.log('Layout server - Querying database for user:', session.user.id);
				const user = await db.query.users.findFirst({
					where: eq(users.id, session.user.id),
					columns: {
						id: true,
						role: true,
						name: true,
						email: true,
						emailVerified: true
					}
				});

				console.log('Layout server - Database query result:', user);

				if (user) {
					userRole = user.role;
					fullUser = user;
					// Cache user data in locals for other server functions to use
					locals.user = {
						id: user.id,
						role: user.role,
						name: user.name,
						email: user.email,
						emailVerified: user.emailVerified || false
					};
					locals.session = session;
					console.log('Layout server - User cached in locals:', user.email, 'Role:', user.role);
				} else {
					console.log('Layout server - No user found in database for ID:', session.user.id);
				}
			} catch (error) {
				console.error('Layout server - Failed to fetch user role:', error);
				console.error(
					'Layout server - Error details:',
					error instanceof Error ? error.message : String(error)
				);
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
	} catch (error) {
		console.error('Layout server - Critical error:', error);
		// Return safe defaults on error
		return {
			user: null,
			session: null,
			userRole: null,
			fullUser: null
		};
	}
};

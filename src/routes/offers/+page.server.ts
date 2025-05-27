import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;
	let user = locals.user;

	console.log('Offers page - Session from locals:', !!session, 'User from locals:', !!user);

	// If no session in locals, get it directly
	if (!session) {
		console.log('Offers page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });

		if (session?.user?.id) {
			user = await db.query.users.findFirst({
				where: eq(users.id, session.user.id),
				columns: {
					id: true,
					role: true,
					name: true,
					email: true
				}
			});
			console.log('Offers page - User fetched from DB:', user?.email, 'Role:', user?.role);
		}
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('Offers page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	// Only allow guides to access this page
	if (!user || user.role !== 'guide') {
		console.log(
			'Offers page - Access denied. User exists:',
			!!user,
			'User role:',
			user?.role,
			'Expected: guide'
		);
		console.log('Offers page - Redirecting to home');
		throw redirect(302, '/');
	}

	console.log('Offers page - Access granted for guide:', user.email);

	return {};
};

import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';

export const load = async ({ request, locals }) => {
	// Try to get session from locals first, fallback to direct auth call
	let session = locals.session;

	console.log('New-trip page - Session from locals:', !!session);

	// If no session in locals, get it directly
	if (!session) {
		console.log('New-trip page - No session in locals, getting directly from auth');
		session = await auth.api.getSession({ headers: request.headers });
	}

	// Redirect if not logged in
	if (!session?.user) {
		console.log('New-trip page - No session, redirecting to signin');
		throw redirect(302, '/signin');
	}

	return {};
};

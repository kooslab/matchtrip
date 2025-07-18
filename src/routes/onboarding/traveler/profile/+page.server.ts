import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	// Check if user already has a profile
	if (locals.user.profileCompleted) {
		throw redirect(302, '/app/dashboard');
	}

	// Only travelers can access this page
	if (locals.user?.role && locals.user.role !== 'traveler') {
		throw redirect(302, '/');
	}

	return {
		user: locals.user
	};
};

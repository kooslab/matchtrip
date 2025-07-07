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

	return {
		user: locals.user
	};
};
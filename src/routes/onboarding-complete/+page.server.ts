import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.user) {
		redirect(302, '/signin');
	}

	// Check if user has agreed to terms
	if (!locals.hasAgreedToTerms) {
		redirect(302, '/agreement');
	}

	// Check if user has selected a role
	if (!locals.user.role) {
		redirect(302, '/select-role');
	}

	return {
		user: locals.user
	};
};
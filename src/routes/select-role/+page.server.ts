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

	// If user already has a role, redirect to appropriate page
	if (locals.user.role) {
		if (locals.user.role === 'guide') {
			redirect(302, '/my-offers');
		} else {
			redirect(302, '/my-trips');
		}
	}

	return {
		user: locals.user
	};
};

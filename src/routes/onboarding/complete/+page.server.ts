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

	// Check if user has set their name
	if (!locals.user.name || locals.user.name.trim().length === 0) {
		redirect(302, '/onboarding/name');
	}

	// Check if user has set their phone
	if (!locals.user.phone) {
		// Guides go to a different phone page (no verification)
		if (locals.user.role === 'guide') {
			redirect(302, '/onboarding/guide-phone');
		} else {
			redirect(302, '/onboarding/phone');
		}
	}

	// Check if user has set their birthdate
	if (!locals.user.birthDate) {
		// Guides go to profile page for birthdate entry
		if (locals.user.role === 'guide') {
			redirect(302, '/onboarding/guide-profile');
		} else {
			redirect(302, '/onboarding/birthdate');
		}
	}

	return {
		user: locals.user
	};
};

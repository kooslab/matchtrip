import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}

	// Check if user is a traveler
	if (locals.user.role !== 'traveler') {
		throw redirect(302, '/');
	}

	return {
		user: locals.user
	};
};

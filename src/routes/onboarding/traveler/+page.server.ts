import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session?.user) {
		redirect(302, '/signin');
	}

	// Only travelers can access this page
	if (locals.user?.role !== 'traveler') {
		redirect(302, '/');
	}

	return {
		user: locals.user
	};
};

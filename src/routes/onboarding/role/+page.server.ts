import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session?.user) {
		redirect(302, '/');
	}

	// If user already has a role, redirect to appropriate page
	if (locals.user?.role) {
		redirect(302, '/');
	}

	return {
		user: locals.user
	};
};

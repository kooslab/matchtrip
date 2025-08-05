import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is logged in and is a guide
	if (!locals.user) {
		throw redirect(303, '/');
	}
	
	if (locals.user.role !== 'guide') {
		throw redirect(303, '/');
	}
	
	return {
		user: locals.user
	};
};
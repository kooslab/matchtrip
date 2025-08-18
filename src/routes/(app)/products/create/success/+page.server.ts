import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Check if user is logged in and is a guide
	if (!locals.user || locals.user.role !== 'guide') {
		throw redirect(303, '/');
	}

	// Get product ID from query params
	const productId = url.searchParams.get('id');

	return {
		user: locals.user,
		productId
	};
};

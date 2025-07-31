import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const session = locals.session;
	const user = locals.user;

	if (!session?.user || !user) {
		redirect(303, '/');
	}

	// Check if user is a guide
	if (user.role !== 'guide') {
		redirect(303, '/');
	}

	// Get tripId from query params
	const tripId = url.searchParams.get('tripId');

	// For pages that require tripId, validate it exists
	const pathSegments = url.pathname.split('/');
	const currentPath = pathSegments[pathSegments.length - 1];

	// Don't require tripId for success page
	if (currentPath !== 'success' && !tripId) {
		redirect(303, '/trips');
	}

	return {
		user: session.user
	};
};

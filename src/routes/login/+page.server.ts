import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
	// If user is already logged in, redirect them
	if (locals.user) {
		// Check for redirect parameter
		const redirectTo = url.searchParams.get('redirect') || '/';
		throw redirect(302, redirectTo);
	}

	return {};
};
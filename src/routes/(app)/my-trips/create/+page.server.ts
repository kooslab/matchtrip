import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async () => {
	// Redirect to the first step of the create flow
	throw redirect(302, '/my-trips/create/destination');
}) satisfies PageServerLoad;
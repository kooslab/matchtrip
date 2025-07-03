import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Redirect to the new complete page
	redirect(302, '/onboarding/complete');
};

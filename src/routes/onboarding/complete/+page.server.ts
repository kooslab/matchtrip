import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// No redirect needed - this IS the complete page
	return {};
};

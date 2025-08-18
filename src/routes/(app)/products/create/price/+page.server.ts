import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();

	// Check if previous step (destination) is completed
	if (!parentData.productData.destinationId) {
		throw redirect(303, '/products/create');
	}

	// Return parent data which includes productData
	return {
		...parentData
	};
};

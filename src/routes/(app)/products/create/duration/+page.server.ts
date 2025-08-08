import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();
	
	// Check if previous steps are completed
	if (!parentData.productData.destinationId) {
		throw redirect(303, '/products/create');
	}
	if (!parentData.productData.price) {
		throw redirect(303, '/products/create/price');
	}
	if (!parentData.productData.description || parentData.productData.description.trim() === '') {
		throw redirect(303, '/products/create/description');
	}
	
	// Return parent data which includes productData
	return {
		...parentData
	};
};
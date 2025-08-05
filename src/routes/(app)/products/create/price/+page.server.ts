import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const parentData = await parent();
	
	// Return parent data which includes productData
	return {
		...parentData
	};
};
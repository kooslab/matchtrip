import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, cookies }) => {
	// Check if user is logged in and is a guide
	if (!locals.user) {
		throw redirect(303, '/');
	}
	
	if (locals.user.role !== 'guide') {
		throw redirect(303, '/');
	}
	
	// Get or initialize product data from cookies
	const productDataCookie = cookies.get('product_create_data');
	let productData = {
		destinationId: null as number | null,
		title: '',
		price: null as number | null,
		description: '',
		duration: null as number | null,
		languages: [] as string[],
		fileIds: [] as string[]
	};
	
	if (productDataCookie) {
		try {
			productData = JSON.parse(productDataCookie);
		} catch (e) {
			// Invalid cookie data, use default
		}
	}
	
	return {
		user: locals.user,
		productData
	};
};
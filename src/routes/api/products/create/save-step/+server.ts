import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	// Check if user is logged in and is a guide
	if (!locals.user || locals.user.role !== 'guide') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { step, data } = await request.json();

	// Get existing product data from cookies
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

	// Update specific step data
	switch (step) {
		case 'destination':
			productData.destinationId = data.destinationId;
			break;
		case 'price':
			productData.price = data.price;
			productData.title = data.title || productData.title;
			break;
		case 'description':
			productData.description = data.description;
			break;
		case 'duration':
			productData.duration = data.duration;
			break;
		case 'languages':
			productData.languages = data.languages;
			break;
		case 'attachments':
			productData.fileIds = data.fileIds;
			break;
	}

	// Save updated data to cookies
	cookies.set('product_create_data', JSON.stringify(productData), {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict',
		maxAge: 60 * 60 * 24 // 24 hours
	});

	return json({ success: true });
};

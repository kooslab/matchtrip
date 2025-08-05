import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { products, destinations, countries } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, cookies }) => {
	const parentData = await parent();
	
	// Get product data from cookies
	const productDataCookie = cookies.get('product_create_data');
	if (!productDataCookie) {
		throw redirect(303, '/products/create');
	}
	
	const productData = JSON.parse(productDataCookie);
	
	// Get destination details
	let destination = null;
	if (productData.destinationId) {
		const result = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				country: {
					id: countries.id,
					name: countries.name
				}
			})
			.from(destinations)
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.where(eq(destinations.id, productData.destinationId))
			.limit(1);
			
		destination = result[0];
	}
	
	// Get language names
	const languageMap: Record<string, string> = {
		'ko': '한국어',
		'en': 'English',
		'ja': '日本語',
		'zh-CN': '中文(简体)',
		'zh-TW': '中文(繁體)',
		'es': 'Español',
		'fr': 'Français',
		'de': 'Deutsch',
		'it': 'Italiano',
		'pt': 'Português',
		'ru': 'Русский',
		'ar': 'العربية',
		'hi': 'हिन्दी',
		'th': 'ไทย',
		'vi': 'Tiếng Việt',
		'id': 'Bahasa Indonesia',
		'ms': 'Bahasa Melayu',
		'tr': 'Türkçe',
		'nl': 'Nederlands',
		'sv': 'Svenska'
	};
	
	const languageNames = productData.languages?.map((code: string) => languageMap[code] || code) || [];
	
	return {
		...parentData,
		productData,
		destination,
		languageNames
	};
};

export const actions = {
	submit: async ({ locals, cookies }) => {
		if (!locals.user || locals.user.role !== 'guide') {
			throw redirect(303, '/');
		}
		
		// Get product data from cookies
		const productDataCookie = cookies.get('product_create_data');
		if (!productDataCookie) {
			throw redirect(303, '/products/create');
		}
		
		const productData = JSON.parse(productDataCookie);
		
		// Create product
		const [newProduct] = await db
			.insert(products)
			.values({
				guideId: locals.user.id,
				destinationId: productData.destinationId,
				title: productData.title || `상품 - ${new Date().toLocaleDateString()}`,
				description: productData.description,
				price: productData.price,
				currency: 'KRW',
				duration: productData.duration,
				languages: productData.languages,
				fileIds: productData.fileIds,
				status: 'active'
			})
			.returning();
		
		// Clear cookie
		cookies.delete('product_create_data', { path: '/' });
		
		// Redirect to success page
		throw redirect(303, `/products/create/success?id=${newProduct.id}`);
	}
} satisfies Actions;
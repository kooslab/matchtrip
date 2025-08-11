import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { products, destinations, countries, continents } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, locals }) => {
	// Check authentication and role
	if (!locals.user) {
		throw redirect(303, '/');
	}
	
	if (locals.user.role !== 'guide') {
		throw redirect(303, '/');
	}

	const productId = params.id;
	
	if (!productId || !uuidRegex.test(productId)) {
		throw redirect(303, '/profile/guide/products');
	}

	try {
		// Fetch product data with destination details
		const productData = await db
			.select({
				id: products.id,
				title: products.title,
				description: products.description,
				price: products.price,
				destinationId: products.destinationId,
				duration: products.duration,
				languages: products.languages,
				fileIds: products.fileIds,
				guideId: products.guideId,
				destinationCity: destinations.city,
				countryName: countries.name,
				continentName: continents.name
			})
			.from(products)
			.leftJoin(destinations, eq(products.destinationId, destinations.id))
			.leftJoin(countries, eq(destinations.countryId, countries.id))
			.leftJoin(continents, eq(countries.continentId, continents.id))
			.where(eq(products.id, productId))
			.limit(1);

		if (!productData.length) {
			throw redirect(303, '/profile/guide/products');
		}

		const product = productData[0];

		// Check if user owns this product
		if (product.guideId !== locals.user.id) {
			throw redirect(303, '/profile/guide/products');
		}

		// Fetch destinations data (same as create page)
		const allDestinations = await db
			.select({
				id: destinations.id,
				city: destinations.city,
				imageUrl: destinations.imageUrl,
				countryId: countries.id,
				countryName: countries.name,
				countryCode: countries.code,
				continentId: continents.id,
				continentName: continents.name,
				continentCode: continents.code
			})
			.from(destinations)
			.innerJoin(countries, eq(destinations.countryId, countries.id))
			.innerJoin(continents, eq(countries.continentId, continents.id))
			.orderBy(continents.name, countries.name, destinations.city);

		// Group destinations by continent and country
		const groupedDestinations: Record<string, {
			name: string;
			code: string;
			countries: Record<string, {
				name: string;
				code: string;
				destinations: Array<{
					id: number;
					city: string;
					imageUrl: string | null;
				}>;
			}>;
		}> = {};
		
		allDestinations.forEach((dest) => {
			const continentName = dest.continentName;
			const countryName = dest.countryName;
			
			if (!groupedDestinations[continentName]) {
				groupedDestinations[continentName] = {
					name: continentName,
					code: dest.continentCode,
					countries: {}
				};
			}
			
			if (!groupedDestinations[continentName].countries[countryName]) {
				groupedDestinations[continentName].countries[countryName] = {
					name: countryName,
					code: dest.countryCode,
					destinations: []
				};
			}
			
			groupedDestinations[continentName].countries[countryName].destinations.push({
				id: dest.id,
				city: dest.city,
				imageUrl: dest.imageUrl
			});
		});

		return {
			product: {
				id: product.id,
				title: product.title,
				description: product.description,
				price: product.price,
				destinationId: product.destinationId,
				duration: product.duration,
				languages: product.languages || [],
				fileIds: product.fileIds || [],
				// Include destination details for display
				destinationCity: product.destinationCity,
				countryName: product.countryName,
				continentName: product.continentName
			},
			destinations: groupedDestinations
		};
	} catch (error) {
		console.error('Error loading product for edit:', error);
		throw redirect(303, '/profile/guide/products');
	}
};
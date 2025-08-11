import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { products } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
	// Check if user is logged in and is a guide
	if (!locals.user || locals.user.role !== 'guide') {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	const { fileIds } = await request.json();
	
	// Get product data from cookies
	const productDataCookie = cookies.get('product_create_data');
	if (!productDataCookie) {
		return json({ error: 'No product data found. Please start from the beginning.' }, { status: 400 });
	}
	
	const productData = JSON.parse(productDataCookie);
	
	// Update with file IDs if provided
	if (fileIds && fileIds.length > 0) {
		productData.fileIds = fileIds;
	}
	
	// Validate required fields
	if (!productData.destinationId) {
		return json({ error: 'Destination is required. Please select a destination.' }, { status: 400 });
	}
	if (!productData.price) {
		return json({ error: 'Price is required. Please enter a price.' }, { status: 400 });
	}
	if (!productData.description || productData.description.trim() === '') {
		return json({ error: 'Description is required. Please enter a description.' }, { status: 400 });
	}
	
	try {
		// Use transaction to ensure atomicity
		const newProduct = await db.transaction(async (tx) => {
			// Generate unique title if not provided
			const { generateProductTitle } = await import('$lib/utils/product-title');
			const title = productData.title || await generateProductTitle(tx);
			
			// Get the first image URL if fileIds exist
			let imageUrl = null;
			if (productData.fileIds && productData.fileIds.length > 0) {
				const { fileUploads } = await import('$lib/server/db/schema');
				const { eq } = await import('drizzle-orm');
				const firstFile = await tx
					.select({ url: fileUploads.url, fileType: fileUploads.fileType })
					.from(fileUploads)
					.where(eq(fileUploads.id, productData.fileIds[0]))
					.limit(1);
				
				// Only set imageUrl if it's an image file
				if (firstFile.length > 0 && firstFile[0].fileType.startsWith('image/')) {
					imageUrl = firstFile[0].url;
				}
			}
			
			// Create product with generated title and imageUrl
			const [product] = await tx
				.insert(products)
				.values({
					guideId: locals.user!.id,
					destinationId: productData.destinationId,
					title,
					description: productData.description,
					price: productData.price,
					currency: 'KRW',
					duration: productData.duration,
					languages: productData.languages || [],
					fileIds: productData.fileIds || [],
					imageUrl,
					status: 'active'
				})
				.returning();
			
			return product;
		});
		
		// Clear cookie
		cookies.delete('product_create_data', { path: '/' });
		
		return json({ 
			success: true, 
			productId: newProduct.id 
		});
	} catch (error) {
		console.error('Error creating product:', error);
		return json({ 
			error: 'Failed to create product. Please try again.' 
		}, { status: 500 });
	}
};;
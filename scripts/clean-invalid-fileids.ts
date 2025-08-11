import 'dotenv/config';
import { db } from '../src/lib/server/db';
import { products, fileUploads } from '../src/lib/server/db/schema';
import { sql, eq, isNotNull } from 'drizzle-orm';

async function cleanInvalidFileIds() {
	console.log('Cleaning invalid file IDs from products...\n');
	
	// Get all products with fileIds
	const productsWithFiles = await db
		.select({
			id: products.id,
			title: products.title,
			fileIds: products.fileIds
		})
		.from(products)
		.where(isNotNull(products.fileIds));
	
	console.log(`Found ${productsWithFiles.length} products with file IDs`);
	
	let cleanedCount = 0;
	
	for (const product of productsWithFiles) {
		if (!product.fileIds || product.fileIds.length === 0) continue;
		
		// Filter out null and 'NULL' string values
		const validFileIds = product.fileIds.filter(id => id && id !== 'NULL');
		
		// Check which file IDs actually exist in the database
		const existingFileIds = [];
		for (const fileId of validFileIds) {
			const [file] = await db
				.select({ id: fileUploads.id })
				.from(fileUploads)
				.where(eq(fileUploads.id, fileId))
				.limit(1);
			
			if (file) {
				existingFileIds.push(fileId);
			}
		}
		
		// Update the product if we removed any invalid file IDs
		if (existingFileIds.length !== validFileIds.length) {
			await db
				.update(products)
				.set({ 
					fileIds: existingFileIds.length > 0 ? existingFileIds : null 
				})
				.where(eq(products.id, product.id));
			
			console.log(`✓ Cleaned "${product.title}": ${validFileIds.length} → ${existingFileIds.length} file IDs`);
			cleanedCount++;
		}
	}
	
	console.log(`\n✓ Cleaned ${cleanedCount} products`);
	process.exit(0);
}

cleanInvalidFileIds().catch(console.error);
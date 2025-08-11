import 'dotenv/config';
import { db } from '../src/lib/server/db';
import { products, fileUploads } from '../src/lib/server/db/schema';
import { eq, isNull, and, isNotNull } from 'drizzle-orm';

async function migrateProductImages() {
	console.log('Starting product image migration...');
	
	try {
		// Find all products that have fileIds but no imageUrl
		const productsToUpdate = await db
			.select({
				id: products.id,
				fileIds: products.fileIds,
				title: products.title
			})
			.from(products)
			.where(
				and(
					isNull(products.imageUrl),
					isNotNull(products.fileIds)
				)
			);
		
		console.log(`Found ${productsToUpdate.length} products to update`);
		
		let updatedCount = 0;
		let skippedCount = 0;
		
		for (const product of productsToUpdate) {
			if (!product.fileIds || product.fileIds.length === 0) {
				skippedCount++;
				continue;
			}
			
			// Filter out any null values from fileIds
			const validFileIds = product.fileIds.filter(id => id !== null && id !== 'NULL');
			if (validFileIds.length === 0) {
				console.log(`⚠ Skipped product "${product.title}" - no valid file IDs`);
				skippedCount++;
				continue;
			}
			
			// Get the first file's URL
			const firstFileId = validFileIds[0];
			const file = await db
				.select({
					url: fileUploads.url,
					fileType: fileUploads.fileType
				})
				.from(fileUploads)
				.where(eq(fileUploads.id, firstFileId))
				.limit(1);
			
			if (file.length > 0) {
				// Only update if it's an image file
				if (file[0].fileType.startsWith('image/')) {
					await db
						.update(products)
						.set({ imageUrl: file[0].url })
						.where(eq(products.id, product.id));
					
					console.log(`✓ Updated product "${product.title}" with image URL: ${file[0].url}`);
					updatedCount++;
				} else {
					console.log(`⚠ Skipped product "${product.title}" - first file is not an image (${file[0].fileType})`);
					skippedCount++;
				}
			} else {
				console.log(`⚠ Skipped product "${product.title}" - file not found in database`);
				skippedCount++;
			}
		}
		
		console.log('\nMigration completed!');
		console.log(`✓ Updated: ${updatedCount} products`);
		console.log(`⚠ Skipped: ${skippedCount} products`);
		
		process.exit(0);
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

// Run the migration
migrateProductImages();
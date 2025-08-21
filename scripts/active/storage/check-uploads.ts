import 'dotenv/config';
import { db } from '../src/lib/server/db';
import { fileUploads, products } from '../src/lib/server/db/schema';
import { sql } from 'drizzle-orm';

async function checkUploads() {
	console.log('Checking file uploads...\n');

	// Count total file uploads
	const [{ count: totalCount }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(fileUploads);

	console.log(`Total file uploads: ${totalCount}`);

	// Count image uploads
	const [{ count: imageCount }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(fileUploads)
		.where(sql`${fileUploads.fileType} LIKE 'image/%'`);

	console.log(`Image uploads: ${imageCount}`);

	// Get a sample of file uploads
	const sampleUploads = await db.select().from(fileUploads).limit(5);

	console.log('\nSample uploads:');
	sampleUploads.forEach((upload) => {
		console.log(`- ${upload.originalName} (${upload.fileType}) - ${upload.url}`);
	});

	// Check products with fileIds
	const productsWithFiles = await db
		.select({
			id: products.id,
			title: products.title,
			fileIds: products.fileIds,
			imageUrl: products.imageUrl
		})
		.from(products)
		.where(sql`${products.fileIds} IS NOT NULL AND array_length(${products.fileIds}, 1) > 0`)
		.limit(5);

	console.log('\nProducts with file IDs:');
	productsWithFiles.forEach((product) => {
		console.log(
			`- ${product.title}: ${product.fileIds?.length || 0} files, imageUrl: ${product.imageUrl || 'none'}`
		);
		if (product.fileIds && product.fileIds.length > 0) {
			console.log(`  First file ID: ${product.fileIds[0]}`);
		}
	});

	process.exit(0);
}

checkUploads().catch(console.error);

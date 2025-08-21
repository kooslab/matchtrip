import 'dotenv/config';
import { db } from '../src/lib/server/db';
import { fileUploads } from '../src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function checkFileIds() {
	const fileIdsToCheck = [
		'451ecc72-d292-412c-b2af-e0654d64c1fb',
		'6ca8a101-f8ec-4f63-b0ad-bef4cb34835a',
		'73784d6d-6eda-4ac5-9517-c312f83364d2',
		'96f3d719-c9f3-4371-9d72-2f5f4227ceff'
	];

	console.log('Checking specific file IDs...\n');

	for (const fileId of fileIdsToCheck) {
		const file = await db.select().from(fileUploads).where(eq(fileUploads.id, fileId)).limit(1);

		if (file.length > 0) {
			console.log(`✓ Found: ${fileId}`);
			console.log(`  Name: ${file[0].originalName}`);
			console.log(`  Type: ${file[0].fileType}`);
			console.log(`  URL: ${file[0].url}\n`);
		} else {
			console.log(`✗ Not found: ${fileId}\n`);
		}
	}

	process.exit(0);
}

checkFileIds().catch(console.error);

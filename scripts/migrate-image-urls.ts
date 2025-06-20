import { db } from '../src/lib/server/db';
import { destinations } from '../src/lib/server/db/schema';
import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID;

async function migrateImageUrls() {
	console.log('Starting image URL migration...');
	
	if (!R2_ACCOUNT_ID) {
		console.error('R2_ACCOUNT_ID not found in environment variables');
		process.exit(1);
	}
	
	try {
		// Get all destinations
		const allDestinations = await db.select().from(destinations);
		console.log(`Found ${allDestinations.length} destinations`);
		
		let updatedCount = 0;
		
		for (const destination of allDestinations) {
			if (destination.imageUrl) {
				// Check if it's using the API endpoint
				if (destination.imageUrl.startsWith('/api/images/destination/')) {
					// Extract the filename from the URL
					const filename = destination.imageUrl.replace('/api/images/', '');
					
					// Update to use the R2 public URL
					const newUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${filename}`;
					
					console.log(`Updating ${destination.city}: ${destination.imageUrl} -> ${newUrl}`);
					
					await db
						.update(destinations)
						.set({ imageUrl: newUrl })
						.where(sql`id = ${destination.id}`);
					
					updatedCount++;
				}
			}
		}
		
		console.log(`Migration complete! Updated ${updatedCount} image URLs`);
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
	
	process.exit(0);
}

migrateImageUrls();
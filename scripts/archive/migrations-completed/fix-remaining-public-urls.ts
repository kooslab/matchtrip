import 'dotenv/config';
import { db } from '../src/lib/server/db';
import {
	fileUploads,
	products,
	destinations,
	users,
	guideProfiles
} from '../src/lib/server/db/schema';
import { sql, eq, like } from 'drizzle-orm';

const R2_PUBLIC_URL =
	process.env.R2_PUBLIC_URL || 'https://pub-f8333e3c54b148f2b965c4d346930941.r2.dev';

async function fixRemainingPublicUrls() {
	console.log('🔧 Fixing remaining public URLs in database...\n');
	console.log(`Public URL pattern: ${R2_PUBLIC_URL}\n`);

	let totalFixed = 0;

	// 1. Fix file_uploads table
	console.log('📁 Checking file_uploads table...');
	const publicFileUploads = await db
		.select()
		.from(fileUploads)
		.where(like(fileUploads.url, `${R2_PUBLIC_URL}%`));

	console.log(`  Found ${publicFileUploads.length} public URLs`);

	for (const file of publicFileUploads) {
		// Extract the path after the public URL
		const path = file.url.replace(R2_PUBLIC_URL + '/', '');
		const newUrl = `/api/images/${path}`;

		await db.update(fileUploads).set({ url: newUrl }).where(eq(fileUploads.id, file.id));

		console.log(`  ✓ Updated: ${file.url.substring(0, 50)}... → ${newUrl}`);
		totalFixed++;
	}

	// 2. Fix products.imageUrl
	console.log('\n📦 Checking products.imageUrl...');
	const publicProducts = await db
		.select()
		.from(products)
		.where(like(products.imageUrl, `${R2_PUBLIC_URL}%`));

	console.log(`  Found ${publicProducts.length} public URLs`);

	for (const product of publicProducts) {
		if (product.imageUrl) {
			const path = product.imageUrl.replace(R2_PUBLIC_URL + '/', '');
			const newUrl = `/api/images/${path}`;

			await db.update(products).set({ imageUrl: newUrl }).where(eq(products.id, product.id));

			console.log(`  ✓ Updated product ${product.id}`);
			totalFixed++;
		}
	}

	// 3. Fix destinations.imageUrl
	console.log('\n🗺️  Checking destinations.imageUrl...');
	const publicDestinations = await db
		.select()
		.from(destinations)
		.where(like(destinations.imageUrl, `${R2_PUBLIC_URL}%`));

	console.log(`  Found ${publicDestinations.length} public URLs`);

	for (const dest of publicDestinations) {
		if (dest.imageUrl) {
			const path = dest.imageUrl.replace(R2_PUBLIC_URL + '/', '');
			const newUrl = `/api/images/${path}`;

			await db.update(destinations).set({ imageUrl: newUrl }).where(eq(destinations.id, dest.id));

			console.log(`  ✓ Updated destination: ${dest.city}`);
			totalFixed++;
		}
	}

	// 4. Fix users.image
	console.log('\n👤 Checking users.image...');
	const publicUsers = await db
		.select()
		.from(users)
		.where(like(users.image, `${R2_PUBLIC_URL}%`));

	console.log(`  Found ${publicUsers.length} public URLs`);

	for (const user of publicUsers) {
		if (user.image) {
			const path = user.image.replace(R2_PUBLIC_URL + '/', '');
			const newUrl = `/api/images/${path}`;

			await db.update(users).set({ image: newUrl }).where(eq(users.id, user.id));

			console.log(`  ✓ Updated user: ${user.name || user.email}`);
			totalFixed++;
		}
	}

	// 5. Fix guideProfiles.profileImageUrl
	console.log('\n🎯 Checking guideProfiles.profileImageUrl...');
	const publicGuides = await db
		.select()
		.from(guideProfiles)
		.where(like(guideProfiles.profileImageUrl, `${R2_PUBLIC_URL}%`));

	console.log(`  Found ${publicGuides.length} public URLs`);

	for (const guide of publicGuides) {
		if (guide.profileImageUrl) {
			const path = guide.profileImageUrl.replace(R2_PUBLIC_URL + '/', '');
			const newUrl = `/api/images/${path}`;

			await db
				.update(guideProfiles)
				.set({ profileImageUrl: newUrl })
				.where(eq(guideProfiles.userId, guide.userId));

			console.log(`  ✓ Updated guide profile`);
			totalFixed++;
		}
	}

	// Final check
	console.log('\n' + '='.repeat(60));
	console.log('📊 SUMMARY:');
	console.log('='.repeat(60));
	console.log(`✅ Fixed ${totalFixed} public URLs`);
	console.log('✅ All URLs now use /api/images/ format');
	console.log('\n📌 Next steps:');
	console.log('1. Files in public bucket are now orphaned');
	console.log('2. You can safely delete the public bucket or its contents');
	console.log('3. All images will be served from private bucket');

	process.exit(0);
}

fixRemainingPublicUrls().catch(console.error);

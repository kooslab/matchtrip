/**
 * Script to populate display IDs for existing records
 * Run this after applying the migration that adds display_id columns
 */

import { db } from '../src/lib/server/db';
import { offers, products, productOffers, payments } from '../src/lib/server/db/schema';
import { isNull, eq } from 'drizzle-orm';
import { 
	generateOfferDisplayId, 
	generateProductDisplayId, 
	generateProductOfferDisplayId,
	generateOfferOrderId,
	generateProductOrderId 
} from '../src/lib/server/utils/displayId';

async function populateDisplayIds() {
	console.log('Starting to populate display IDs for existing records...');
	
	try {
		// Populate offers display IDs
		console.log('Populating offers display IDs...');
		const offersWithoutId = await db
			.select({ id: offers.id })
			.from(offers)
			.where(isNull(offers.displayId));
		
		for (const offer of offersWithoutId) {
			await db
				.update(offers)
				.set({ displayId: generateOfferDisplayId() })
				.where(eq(offers.id, offer.id));
		}
		console.log(`✓ Updated ${offersWithoutId.length} offers`);
		
		// Populate products display IDs
		console.log('Populating products display IDs...');
		const productsWithoutId = await db
			.select({ id: products.id })
			.from(products)
			.where(isNull(products.displayId));
		
		for (const product of productsWithoutId) {
			await db
				.update(products)
				.set({ displayId: generateProductDisplayId() })
				.where(eq(products.id, product.id));
		}
		console.log(`✓ Updated ${productsWithoutId.length} products`);
		
		// Populate product offers display IDs
		console.log('Populating product offers display IDs...');
		const productOffersWithoutId = await db
			.select({ id: productOffers.id })
			.from(productOffers)
			.where(isNull(productOffers.displayId));
		
		for (const productOffer of productOffersWithoutId) {
			await db
				.update(productOffers)
				.set({ displayId: generateProductOfferDisplayId() })
				.where(eq(productOffers.id, productOffer.id));
		}
		console.log(`✓ Updated ${productOffersWithoutId.length} product offers`);
		
		// Populate payments display IDs
		console.log('Populating payments display IDs...');
		const paymentsWithoutId = await db
			.select({ 
				id: payments.id,
				offerId: payments.offerId,
				productId: payments.productId 
			})
			.from(payments)
			.where(isNull(payments.displayId));
		
		for (const payment of paymentsWithoutId) {
			// Determine if it's an offer order or product order
			const displayId = payment.offerId 
				? generateOfferOrderId() 
				: generateProductOrderId();
				
			await db
				.update(payments)
				.set({ displayId })
				.where(eq(payments.id, payment.id));
		}
		console.log(`✓ Updated ${paymentsWithoutId.length} payments`);
		
		console.log('✅ Successfully populated all display IDs!');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error populating display IDs:', error);
		process.exit(1);
	}
}

// Run the script
populateDisplayIds();
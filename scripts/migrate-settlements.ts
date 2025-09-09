#!/usr/bin/env bun

/**
 * Migration script to create settlement records for existing completed payments
 * Run with: bun run scripts/migrate-settlements.ts
 */

import { db } from '../src/lib/server/db';
import { payments, settlements } from '../src/lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

const DEFAULT_COMMISSION_RATE = 1000; // 10%
const DEFAULT_TAX_RATE = 330; // 3.3%

async function migrateSettlements() {
	console.log('Starting settlement migration...');

	try {
		// Get all completed payments that don't have settlements
		const completedPayments = await db
			.select()
			.from(payments)
			.where(eq(payments.status, 'completed'));

		console.log(`Found ${completedPayments.length} completed payments`);

		// Get existing settlements to check which payments already have them
		const existingSettlements = await db.select().from(settlements);
		const existingPaymentIds = new Set(existingSettlements.map(s => s.paymentId));
		
		// Filter out payments that already have settlements
		const paymentsNeedingSettlement = completedPayments.filter(
			p => !existingPaymentIds.has(p.id)
		);

		console.log(`${paymentsNeedingSettlement.length} payments need settlements`);

		if (paymentsNeedingSettlement.length === 0) {
			console.log('No new settlements to create');
			return;
		}

		// Create settlements for each payment
		const newSettlements = paymentsNeedingSettlement.map(payment => {
			const paymentAmount = payment.amount;
			const commissionAmount = Math.floor(paymentAmount * (DEFAULT_COMMISSION_RATE / 10000));
			const taxAmount = Math.floor(paymentAmount * (DEFAULT_TAX_RATE / 10000));
			const settlementAmount = paymentAmount - commissionAmount - taxAmount;

			return {
				paymentId: payment.id,
				commissionRate: DEFAULT_COMMISSION_RATE,
				commissionAmount,
				taxRate: DEFAULT_TAX_RATE,
				taxAmount,
				settlementAmount,
				status: 'pending' as const,
				createdAt: payment.paidAt || payment.createdAt,
				updatedAt: new Date()
			};
		});

		// Insert all settlements
		const inserted = await db.insert(settlements).values(newSettlements).returning();

		console.log(`Successfully created ${inserted.length} settlement records`);
		
		// Show summary
		const totalSettlementAmount = inserted.reduce((sum, s) => sum + s.settlementAmount, 0);
		const totalCommission = inserted.reduce((sum, s) => sum + s.commissionAmount, 0);
		const totalTax = inserted.reduce((sum, s) => sum + s.taxAmount, 0);

		console.log('\nSummary:');
		console.log(`Total settlement amount: ₩${totalSettlementAmount.toLocaleString()}`);
		console.log(`Total commission: ₩${totalCommission.toLocaleString()}`);
		console.log(`Total tax: ₩${totalTax.toLocaleString()}`);

	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}

	console.log('\nMigration completed successfully!');
	process.exit(0);
}

// Run migration
migrateSettlements();
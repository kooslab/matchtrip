import { format } from 'date-fns';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { productSequences } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';

export async function generateProductTitle(
	tx: PgTransaction<any, any, any> | NeonHttpDatabase<any>
): Promise<string> {
	const yearMonth = format(new Date(), 'yyyyMM');

	// Upsert: Insert if not exists, or increment if exists
	const [sequence] = await tx
		.insert(productSequences)
		.values({
			yearMonth,
			lastSequence: 1
		})
		.onConflictDoUpdate({
			target: productSequences.yearMonth,
			set: {
				lastSequence: sql`${productSequences.lastSequence} + 1`,
				updatedAt: new Date()
			}
		})
		.returning();

	// Format: MT-YYYYMM-XXXXXX
	const sequenceNumber = String(sequence.lastSequence).padStart(6, '0');
	return `MT-${yearMonth}-${sequenceNumber}`;
}

import { db } from '$lib/server/db';
import { refundPolicies } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import type { RefundPolicy } from '$lib/utils/refundCalculator';

/**
 * Fetch active refund policies from database
 * This is a server-only function that accesses the database
 */
export async function fetchRefundPolicies(policyType: 'trip' | 'product'): Promise<RefundPolicy[]> {
	try {
		const policies = await db
			.select({
				daysBeforeStart: refundPolicies.daysBeforeStart,
				daysBeforeEnd: refundPolicies.daysBeforeEnd,
				refundPercentage: refundPolicies.refundPercentage,
				applicableTo: refundPolicies.applicableTo
			})
			.from(refundPolicies)
			.where(
				and(
					eq(refundPolicies.applicableTo, policyType),
					eq(refundPolicies.isActive, true)
				)
			)
			.orderBy(refundPolicies.daysBeforeStart);

		return policies;
	} catch (error) {
		console.error('Error fetching refund policies:', error);
		return [];
	}
}
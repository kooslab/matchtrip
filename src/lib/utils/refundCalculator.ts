import { REFUND_POLICIES, EXCEPTION_REASONS } from '$lib/constants/cancellation';
import type {
	TravelerCancellationReason,
	GuideCancellationReason
} from '$lib/constants/cancellation';
import { db } from '$lib/server/db';
import { refundPolicies } from '$lib/server/db/schema';
import { and, eq, gte, lte, or, isNull } from 'drizzle-orm';

interface RefundCalculationParams {
	amount: number; // Original payment amount in KRW
	tripStartDate: Date; // Trip start date
	cancellationDate?: Date; // Date of cancellation request (defaults to now)
	requesterType: 'traveler' | 'guide';
	reasonType?: TravelerCancellationReason | GuideCancellationReason;
	policyType?: 'trip' | 'product'; // Type of policy to apply
	customPolicies?: RefundPolicy[]; // Optional custom policies (from database)
}

interface RefundPolicy {
	daysBeforeStart: number;
	daysBeforeEnd: number | null;
	refundPercentage: number;
	applicableTo: string;
}

interface RefundCalculationResult {
	originalAmount: number;
	refundAmount: number;
	refundPercentage: number;
	deductionAmount: number;
	daysBeforeTrip: number;
	policyApplied: string;
	requiresAdminApproval: boolean;
}

/**
 * Fetch active refund policies from database
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

/**
 * Calculate refund amount based on cancellation timing and reason
 */
export function calculateRefundAmount(params: RefundCalculationParams): RefundCalculationResult {
	const {
		amount,
		tripStartDate,
		cancellationDate = new Date(),
		requesterType,
		reasonType,
		policyType = 'trip',
		customPolicies
	} = params;

	// Calculate days before trip (considering timezone differences)
	const tripStart = new Date(tripStartDate);
	tripStart.setHours(0, 0, 0, 0);

	const cancellation = new Date(cancellationDate);
	cancellation.setHours(0, 0, 0, 0);

	const timeDiff = tripStart.getTime() - cancellation.getTime();
	const daysBeforeTrip = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

	// Guide cancellation ALWAYS results in 100% refund (even for past trips)
	if (requesterType === 'guide') {
		return {
			originalAmount: amount,
			refundAmount: amount,
			refundPercentage: 100,
			deductionAmount: 0,
			daysBeforeTrip,
			policyApplied: '가이드 취소 - 전액 환불',
			requiresAdminApproval: false
		};
	}

	// Check if trip has already passed (only applies to traveler cancellations)
	if (isPastTrip(tripStartDate)) {
		// For past trips, always require admin approval
		return {
			originalAmount: amount,
			refundAmount: 0, // Admin will determine actual refund amount
			refundPercentage: 0,
			deductionAmount: amount,
			daysBeforeTrip,
			policyApplied: '여행 종료 - 관리자 검토 필요',
			requiresAdminApproval: true
		};
	}

	// Check if this is an exception case requiring admin approval
	const requiresAdminApproval = reasonType ? EXCEPTION_REASONS.includes(reasonType as any) : false;

	// For exception cases, calculate as 100% refund (pending admin approval)
	if (requiresAdminApproval) {
		return {
			originalAmount: amount,
			refundAmount: amount,
			refundPercentage: 100,
			deductionAmount: 0,
			daysBeforeTrip,
			policyApplied: '예외 상황 - 관리자 승인 필요',
			requiresAdminApproval: true
		};
	}

	// Use custom policies if provided, otherwise fall back to hardcoded ones
	if (customPolicies && customPolicies.length > 0) {
		// Find applicable policy from database policies
		let applicablePolicy: RefundPolicy | null = null;
		let policyLabel = '';

		for (const policy of customPolicies) {
			const meetsStartCondition = daysBeforeTrip >= policy.daysBeforeStart;
			const meetsEndCondition = policy.daysBeforeEnd === null || daysBeforeTrip <= policy.daysBeforeEnd;

			if (meetsStartCondition && meetsEndCondition) {
				applicablePolicy = policy;
				
				// Generate label based on policy range
				if (policy.daysBeforeStart === 0 && policy.daysBeforeEnd === 0) {
					policyLabel = '여행일 당일';
				} else if (policy.daysBeforeEnd === null) {
					policyLabel = `여행시작 ${policy.daysBeforeStart}일 전까지`;
				} else {
					policyLabel = `여행시작 ${policy.daysBeforeStart}-${policy.daysBeforeEnd}일 전`;
				}
				break;
			}
		}

		if (applicablePolicy) {
			const refundPercentage = applicablePolicy.refundPercentage;
			const refundAmount = Math.floor((amount * refundPercentage) / 100);
			const deductionAmount = amount - refundAmount;

			return {
				originalAmount: amount,
				refundAmount,
				refundPercentage,
				deductionAmount,
				daysBeforeTrip,
				policyApplied: policyLabel,
				requiresAdminApproval: false
			};
		}
	}

	// Fallback to hardcoded policies if no custom policies or no applicable policy found
	let applicablePolicy = REFUND_POLICIES[REFUND_POLICIES.length - 1]; // Default to last policy

	for (const policy of REFUND_POLICIES) {
		if (daysBeforeTrip >= policy.daysFrom) {
			applicablePolicy = policy;
			break;
		}
	}

	const refundPercentage = applicablePolicy.percentage;
	const refundAmount = Math.floor((amount * refundPercentage) / 100);
	const deductionAmount = amount - refundAmount;

	return {
		originalAmount: amount,
		refundAmount,
		refundPercentage,
		deductionAmount,
		daysBeforeTrip,
		policyApplied: applicablePolicy.label,
		requiresAdminApproval: false
	};
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('ko-KR', {
		style: 'currency',
		currency: 'KRW',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Get refund policy description for display
 */
export function getRefundPolicyDescription(): string[] {
	return REFUND_POLICIES.map((policy) => {
		const percentage = policy.percentage;
		const deduction = 100 - percentage;

		if (percentage === 100) {
			return `• ${policy.label}: 전액 환불`;
		} else if (percentage === 50) {
			return `• ${policy.label}: 50% 공제 후 환불`;
		} else {
			return `• ${policy.label}: ${deduction}% 공제 후 환불`;
		}
	});
}

/**
 * Check if cancellation is still possible
 */
export function canCancelBooking(tripStartDate: Date): boolean {
	const now = new Date();
	const tripStart = new Date(tripStartDate);

	// Can cancel if trip hasn't started yet
	return tripStart > now;
}

/**
 * Check if trip has already started or ended
 */
export function isPastTrip(tripStartDate: Date): boolean {
	const now = new Date();
	const tripStart = new Date(tripStartDate);

	// Trip is considered past if start date has passed
	return tripStart <= now;
}

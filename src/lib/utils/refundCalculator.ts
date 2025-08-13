import { REFUND_POLICIES, EXCEPTION_REASONS } from '$lib/constants/cancellation';
import type { TravelerCancellationReason, GuideCancellationReason } from '$lib/constants/cancellation';

interface RefundCalculationParams {
	amount: number; // Original payment amount in KRW
	tripStartDate: Date; // Trip start date
	cancellationDate?: Date; // Date of cancellation request (defaults to now)
	requesterType: 'traveler' | 'guide';
	reasonType?: TravelerCancellationReason | GuideCancellationReason;
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
 * Calculate refund amount based on cancellation timing and reason
 */
export function calculateRefundAmount(params: RefundCalculationParams): RefundCalculationResult {
	const {
		amount,
		tripStartDate,
		cancellationDate = new Date(),
		requesterType,
		reasonType
	} = params;

	// Calculate days before trip (considering timezone differences)
	const tripStart = new Date(tripStartDate);
	tripStart.setHours(0, 0, 0, 0);
	
	const cancellation = new Date(cancellationDate);
	cancellation.setHours(0, 0, 0, 0);
	
	const timeDiff = tripStart.getTime() - cancellation.getTime();
	const daysBeforeTrip = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

	// Check if trip has already passed
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

	// Guide cancellation always results in 100% refund
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

	// Find applicable refund policy based on days before trip
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
	return REFUND_POLICIES.map(policy => {
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
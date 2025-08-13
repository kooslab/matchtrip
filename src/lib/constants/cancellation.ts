// Cancellation reason labels for traveler
export const TRAVELER_CANCELLATION_REASONS = {
	schedule_change: '일정 변경',
	booking_mismatch: '예약 조건 불일치',
	guide_unresponsive: '가이드 무응답',
	guide_unavailable: '가이드 일정 불가',
	natural_disaster: '천재지변',
	medical_emergency: '개인 사고/상해',
	other: '기타'
} as const;

// Cancellation reason labels for guide
export const GUIDE_CANCELLATION_REASONS = {
	traveler_request: '여행자 요청(합의)',
	traveler_unresponsive: '여행자 무응답',
	facility_unavailable: '현지시설 이용불가',
	guide_unavailable: '가이드 일정 불가',
	natural_disaster: '천재지변',
	medical_emergency: '의료 응급상황',
	other: '기타'
} as const;

// Refund policy based on cancellation timing (days before trip)
export const REFUND_POLICIES = [
	{ daysFrom: 30, daysTo: null, percentage: 100, label: '여행시작 30일 전까지' },
	{ daysFrom: 20, daysTo: 29, percentage: 90, label: '여행시작 20일 전까지' },
	{ daysFrom: 6, daysTo: 19, percentage: 85, label: '여행시작 6일 전까지' },
	{ daysFrom: 1, daysTo: 5, percentage: 80, label: '여행시작 1일 전까지' },
	{ daysFrom: 0, daysTo: 0, percentage: 50, label: '여행일 당일' }
] as const;

// Exception reasons that qualify for 100% refund (requires admin approval)
export const EXCEPTION_REASONS = [
	'natural_disaster',
	'medical_emergency'
] as const;

// Cancellation status labels
export const CANCELLATION_STATUS_LABELS = {
	pending: '승인 대기',
	approved: '승인됨',
	rejected: '거절됨',
	cancelled: '취소됨'
} as const;

// Cancellation status colors for UI
export const CANCELLATION_STATUS_COLORS = {
	pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
	approved: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
	rejected: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
	cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' }
} as const;

export type TravelerCancellationReason = keyof typeof TRAVELER_CANCELLATION_REASONS;
export type GuideCancellationReason = keyof typeof GUIDE_CANCELLATION_REASONS;
export type CancellationStatus = keyof typeof CANCELLATION_STATUS_LABELS;
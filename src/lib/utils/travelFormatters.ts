import {
	TRAVEL_STYLES,
	TRAVEL_METHODS,
	ACCOMMODATION_TYPES,
	ACTIVITY_TYPES,
	TRIP_STATUS,
	OFFER_STATUS,
	PAYMENT_STATUS,
	type TravelStyle,
	type TravelMethod,
	type AccommodationType,
	type ActivityType,
	type TripStatus,
	type OfferStatus,
	type PaymentStatus
} from '$lib/constants/travel';

export function formatTravelStyle(style: string | null | undefined): string {
	if (!style) return '미정';
	return TRAVEL_STYLES[style as TravelStyle] || style;
}

export function formatTravelMethod(method: string | null | undefined): string {
	if (!method) return '미정';
	return TRAVEL_METHODS[method as TravelMethod] || method;
}

export function formatAccommodationType(type: string | null | undefined): string {
	if (!type) return '미정';
	return ACCOMMODATION_TYPES[type as AccommodationType] || type;
}

export function formatActivityType(type: string | null | undefined): string {
	if (!type) return '미정';
	return ACTIVITY_TYPES[type as ActivityType] || type;
}

export function formatActivities(activities: string[] | null | undefined): string {
	if (!activities || activities.length === 0) return '미정';
	return activities.map((activity) => formatActivityType(activity)).join(' / ');
}

export function formatTripStatus(status: string | null | undefined): string {
	if (!status) return '미정';
	return TRIP_STATUS[status as TripStatus] || status;
}

export function formatOfferStatus(status: string | null | undefined): string {
	if (!status) return '미정';
	return OFFER_STATUS[status as OfferStatus] || status;
}

export function formatPaymentStatus(status: string | null | undefined): string {
	if (!status) return '미정';
	return PAYMENT_STATUS[status as PaymentStatus] || status;
}

// Badge configurations for different statuses
export const STATUS_BADGES = {
	trip: {
		draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
		submitted: { bg: 'bg-blue-100', text: 'text-blue-800' },
		accepted: { bg: 'bg-green-100', text: 'text-green-800' },
		completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
		cancelled: { bg: 'bg-red-100', text: 'text-red-800' }
	},
	offer: {
		pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
		accepted: { bg: 'bg-green-100', text: 'text-green-800' },
		rejected: { bg: 'bg-red-100', text: 'text-red-800' },
		withdrawn: { bg: 'bg-gray-100', text: 'text-gray-800' },
		cancelled: { bg: 'bg-gray-100', text: 'text-gray-800' }
	},
	payment: {
		pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
		completed: { bg: 'bg-green-100', text: 'text-green-800' },
		cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
		failed: { bg: 'bg-red-100', text: 'text-red-800' },
		refunded: { bg: 'bg-purple-100', text: 'text-purple-800' },
		succeeded: { bg: 'bg-green-100', text: 'text-green-800' }
	}
} as const;
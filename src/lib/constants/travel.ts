// Travel Style Constants
export const TRAVEL_STYLES = {
	friends: '친구들과 함께 하는 여행',
	parents: '부모님과 함께 하는 여행',
	children: '가족과 함께하는 여행',
	business: '직장동료와 함께하는 비즈니스 여행',
	other: '기타여행'
} as const;

export const TRAVEL_STYLE_OPTIONS = [
	{ id: 'friends', name: TRAVEL_STYLES.friends },
	{ id: 'parents', name: TRAVEL_STYLES.parents },
	{ id: 'children', name: TRAVEL_STYLES.children },
	{ id: 'business', name: TRAVEL_STYLES.business },
	{ id: 'other', name: TRAVEL_STYLES.other }
] as const;

// Travel Method Constants
export const TRAVEL_METHODS = {
	walking: '도보',
	driving: '자동차',
	public_transport: '대중교통',
	bike: '자전거',
	'walking+public_transport': '도보+대중교통',
	'walking+bike': '도보+자전거',
	'walking+driving': '도보+자동차',
	'walking+driving+public_transport': '도보+자동차+대중교통',
	'walking+driving+bike': '도보+자동차+자전거',
	'walking+driving+public_transport+bike': '모든 교통수단',
	other: '기타'
} as const;

export const TRAVEL_METHOD_OPTIONS = [
	{ value: 'walking', label: TRAVEL_METHODS.walking, icon: '🚶' },
	{ value: 'public_transport', label: TRAVEL_METHODS.public_transport, icon: '🚌' },
	{ value: 'driving', label: TRAVEL_METHODS.driving, icon: '🚗' },
	{ value: 'bike', label: TRAVEL_METHODS.bike, icon: '🚴' }
] as const;

// Accommodation Type Constants
export const ACCOMMODATION_TYPES = {
	hotel: '호텔',
	resort: '리조트',
	guesthouse: '게스트하우스',
	hostel: '호스텔',
	airbnb: '에어비앤비',
	traditional: '전통 숙소',
	pension: '펜션',
	camping: '캠핑',
	hanok: '한옥',
	no_preference: '상관없음'
} as const;

export const ACCOMMODATION_OPTIONS = [
	{ id: 'hotel', name: ACCOMMODATION_TYPES.hotel, icon: '🏨' },
	{ id: 'resort', name: ACCOMMODATION_TYPES.resort, icon: '🏖️' },
	{ id: 'guesthouse', name: ACCOMMODATION_TYPES.guesthouse, icon: '🏠' },
	{ id: 'airbnb', name: ACCOMMODATION_TYPES.airbnb, icon: '🏡' },
	{ id: 'hostel', name: ACCOMMODATION_TYPES.hostel, icon: '🛏️' },
	{ id: 'pension', name: ACCOMMODATION_TYPES.pension, icon: '🏘️' },
	{ id: 'camping', name: ACCOMMODATION_TYPES.camping, icon: '⛺' },
	{ id: 'hanok', name: ACCOMMODATION_TYPES.hanok, icon: '🏯' },
	{ id: 'traditional', name: ACCOMMODATION_TYPES.traditional, icon: '🏯' },
	{ id: 'no_preference', name: ACCOMMODATION_TYPES.no_preference, icon: '🤷' }
] as const;

// Activity Type Constants
export const ACTIVITY_TYPES = {
	tourism: '관광',
	experience: '체험',
	shopping: '쇼핑',
	food: '맛집탐방',
	'business-trip': '비즈니스',
	accommodation: '숙박(민박)',
	'organization-visit': '기관방문',
	'other-tour': '기타투어'
} as const;

export const ACTIVITY_OPTIONS = [
	{ id: 'tourism', name: ACTIVITY_TYPES.tourism, icon: '🏛️' },
	{ id: 'experience', name: ACTIVITY_TYPES.experience, icon: '🎨' },
	{ id: 'shopping', name: ACTIVITY_TYPES.shopping, icon: '🛍️' },
	{ id: 'food', name: ACTIVITY_TYPES.food, icon: '🍜' },
	{ id: 'business-trip', name: ACTIVITY_TYPES['business-trip'], icon: '💼' },
	{ id: 'accommodation', name: ACTIVITY_TYPES.accommodation, icon: '🏠' },
	{ id: 'organization-visit', name: ACTIVITY_TYPES['organization-visit'], icon: '🏢' },
	{ id: 'other-tour', name: ACTIVITY_TYPES['other-tour'], icon: '🎯' }
] as const;

// Trip Status Constants
export const TRIP_STATUS = {
	draft: '임시저장',
	submitted: '제출됨',
	accepted: '수락됨',
	completed: '완료됨',
	cancelled: '취소됨'
} as const;

// Offer Status Constants
export const OFFER_STATUS = {
	pending: '검토중',
	accepted: '수락됨',
	rejected: '거절됨',
	withdrawn: '철회됨',
	cancelled: '취소됨'
} as const;

// Payment Status Constants
export const PAYMENT_STATUS = {
	pending: '결제 대기',
	completed: '결제 완료',
	cancelled: '결제 취소',
	failed: '결제 실패',
	refunded: '환불 완료',
	succeeded: '성공'
} as const;

// Type exports
export type TravelStyle = keyof typeof TRAVEL_STYLES;
export type TravelMethod = keyof typeof TRAVEL_METHODS;
export type AccommodationType = keyof typeof ACCOMMODATION_TYPES;
export type ActivityType = keyof typeof ACTIVITY_TYPES;
export type TripStatus = keyof typeof TRIP_STATUS;
export type OfferStatus = keyof typeof OFFER_STATUS;
export type PaymentStatus = keyof typeof PAYMENT_STATUS;
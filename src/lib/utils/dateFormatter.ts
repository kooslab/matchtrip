export interface DateFormatOptions {
	locale?: string;
	timezone?: string;
	includeTime?: boolean;
	format?: 'short' | 'medium' | 'long' | 'full';
}

export function getUserTimezone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function getUserLocale(): string {
	if (typeof navigator !== 'undefined' && navigator.language) {
		return navigator.language;
	}
	return 'en-US';
}

export function formatDate(
	date: Date | string | number,
	options: DateFormatOptions = {}
): string {
	const {
		locale = getUserLocale(),
		timezone = getUserTimezone(),
		includeTime = false,
		format = 'medium'
	} = options;

	const dateObj = date instanceof Date ? date : new Date(date);

	if (isNaN(dateObj.getTime())) {
		return 'Invalid Date';
	}

	const dateOptions: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		year: 'numeric',
		month: format === 'short' ? 'short' : format === 'long' || format === 'full' ? 'long' : 'numeric',
		day: 'numeric'
	};

	if (includeTime) {
		dateOptions.hour = 'numeric';
		dateOptions.minute = 'numeric';
		if (format === 'full') {
			dateOptions.second = 'numeric';
		}
	}

	return new Intl.DateTimeFormat(locale, dateOptions).format(dateObj);
}

export function formatTime(
	date: Date | string | number,
	options: Omit<DateFormatOptions, 'includeTime'> = {}
): string {
	const {
		locale = getUserLocale(),
		timezone = getUserTimezone(),
		format = 'medium'
	} = options;

	const dateObj = date instanceof Date ? date : new Date(date);

	if (isNaN(dateObj.getTime())) {
		return 'Invalid Time';
	}

	const timeOptions: Intl.DateTimeFormatOptions = {
		timeZone: timezone,
		hour: 'numeric',
		minute: 'numeric'
	};

	if (format === 'full' || format === 'long') {
		timeOptions.second = 'numeric';
	}

	return new Intl.DateTimeFormat(locale, timeOptions).format(dateObj);
}

export function formatRelativeTime(date: Date | string | number, locale: string = getUserLocale()): string {
	const dateObj = date instanceof Date ? date : new Date(date);
	const now = new Date();
	const diffInMs = now.getTime() - dateObj.getTime();
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	if (diffInMinutes < 1) {
		return locale.startsWith('ko') ? '방금 전' : 'just now';
	} else if (diffInMinutes < 60) {
		return locale.startsWith('ko') ? `${diffInMinutes}분 전` : `${diffInMinutes}m ago`;
	} else if (diffInHours < 24) {
		return locale.startsWith('ko') ? `${diffInHours}시간 전` : `${diffInHours}h ago`;
	} else if (diffInDays < 7) {
		return locale.startsWith('ko') ? `${diffInDays}일 전` : `${diffInDays}d ago`;
	} else {
		return formatDate(dateObj, { locale, format: 'short' });
	}
}

export function formatDateRange(
	startDate: Date | string | number,
	endDate: Date | string | number,
	options: DateFormatOptions = {}
): string {
	const start = formatDate(startDate, options);
	const end = formatDate(endDate, options);
	return `${start} - ${end}`;
}

export function formatKoreanDate(date: Date | string | number): string {
	const dateObj = date instanceof Date ? date : new Date(date);
	
	if (isNaN(dateObj.getTime())) {
		return 'Invalid Date';
	}
	
	const year = dateObj.getFullYear();
	const month = String(dateObj.getMonth() + 1).padStart(2, '0');
	const day = String(dateObj.getDate()).padStart(2, '0');
	
	return `${year}. ${month}. ${day}`;
}

export function formatKoreanDateRange(
	startDate: Date | string | number,
	endDate: Date | string | number
): string {
	const start = formatKoreanDate(startDate);
	const end = formatKoreanDate(endDate);
	return `${start} - ${end}`;
}

export function isToday(date: Date | string | number): boolean {
	const dateObj = date instanceof Date ? date : new Date(date);
	const today = new Date();
	return (
		dateObj.getFullYear() === today.getFullYear() &&
		dateObj.getMonth() === today.getMonth() &&
		dateObj.getDate() === today.getDate()
	);
}

export function isYesterday(date: Date | string | number): boolean {
	const dateObj = date instanceof Date ? date : new Date(date);
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return (
		dateObj.getFullYear() === yesterday.getFullYear() &&
		dateObj.getMonth() === yesterday.getMonth() &&
		dateObj.getDate() === yesterday.getDate()
	);
}
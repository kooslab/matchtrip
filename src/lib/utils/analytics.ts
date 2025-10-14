import { browser } from '$app/environment';
import { PUBLIC_GA_MEASUREMENT_ID } from '$env/static/public';

// Type definitions for Google Analytics gtag
declare global {
	interface Window {
		gtag?: (
			command: 'config' | 'event' | 'set',
			targetId: string,
			config?: Record<string, unknown>
		) => void;
		dataLayer?: unknown[];
	}
}

/**
 * Check if gtag is available
 */
function isGtagAvailable(): boolean {
	return browser && typeof window.gtag === 'function';
}

/**
 * Track a pageview
 */
export function trackPageView(url: string): void {
	if (!isGtagAvailable() || !PUBLIC_GA_MEASUREMENT_ID) return;

	window.gtag?.('config', PUBLIC_GA_MEASUREMENT_ID, {
		page_path: url
	});
}

/**
 * Set user properties
 */
export function setUserProperties(properties: {
	user_role?: 'traveler' | 'guide' | 'admin';
	is_authenticated?: boolean;
}): void {
	if (!isGtagAvailable() || !PUBLIC_GA_MEASUREMENT_ID) return;

	window.gtag?.('set', PUBLIC_GA_MEASUREMENT_ID, {
		user_properties: properties
	});
}

/**
 * Track a custom event
 */
export function trackEvent(
	eventName: string,
	parameters?: Record<string, string | number | boolean>
): void {
	if (!isGtagAvailable()) return;

	window.gtag?.('event', eventName, parameters);
}

// Specific event tracking functions

/**
 * Track user signup completion
 */
export function trackSignup(role: 'traveler' | 'guide'): void {
	trackEvent('signup_complete', {
		user_role: role
	});
}

/**
 * Track trip creation
 */
export function trackTripCreated(destination: string, startDate?: string, endDate?: string): void {
	trackEvent('trip_created', {
		destination,
		start_date: startDate || '',
		end_date: endDate || ''
	});
}

/**
 * Track offer submission
 */
export function trackOfferSubmitted(amount: number): void {
	trackEvent('offer_submitted', {
		value: amount,
		currency: 'KRW'
	});
}

/**
 * Track payment completion
 */
export function trackPaymentComplete(amount: number, paymentKey?: string): void {
	trackEvent('payment_complete', {
		value: amount,
		currency: 'KRW',
		transaction_id: paymentKey || ''
	});
}

/**
 * Track payment failure
 */
export function trackPaymentFailed(reason?: string): void {
	trackEvent('payment_failed', {
		reason: reason || 'unknown'
	});
}

/**
 * Track refund completion
 */
export function trackRefundComplete(amount: number, refundKey?: string): void {
	trackEvent('refund_complete', {
		value: amount,
		currency: 'KRW',
		transaction_id: refundKey || ''
	});
}

/**
 * Track review submission
 */
export function trackReviewSubmitted(rating: number): void {
	trackEvent('review_submitted', {
		rating
	});
}

/**
 * Track search usage
 */
export function trackSearch(searchTerm: string): void {
	trackEvent('search', {
		search_term: searchTerm
	});
}

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

interface LocationData {
	latitude: number | null;
	longitude: number | null;
	timezone: string;
	locale: string;
	error: string | null;
}

function createLocationStore() {
	const { subscribe, set, update } = writable<LocationData>({
		latitude: null,
		longitude: null,
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		locale: browser ? navigator.language : 'en-US',
		error: null
	});

	async function detectLocation() {
		if (!browser) return;

		try {
			if ('geolocation' in navigator) {
				const position = await new Promise<GeolocationPosition>((resolve, reject) => {
					navigator.geolocation.getCurrentPosition(resolve, reject, {
						enableHighAccuracy: false,
						timeout: 5000,
						maximumAge: 300000 // 5 minutes
					});
				});

				update((state) => ({
					...state,
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
					error: null
				}));
			}
		} catch (error) {
			update((state) => ({
				...state,
				error: error instanceof Error ? error.message : 'Location detection failed'
			}));
		}

		// Always update timezone and locale regardless of geolocation success
		update((state) => ({
			...state,
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			locale: navigator.language
		}));
	}

	// Auto-detect on store creation in browser
	if (browser) {
		detectLocation();
	}

	return {
		subscribe,
		detectLocation,
		reset: () =>
			set({
				latitude: null,
				longitude: null,
				timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
				locale: browser ? navigator.language : 'en-US',
				error: null
			})
	};
}

export const locationStore = createLocationStore();

// Derived store for just timezone
export const userTimezone = derived(locationStore, ($location) => $location.timezone);

// Derived store for just locale
export const userLocale = derived(locationStore, ($location) => $location.locale);

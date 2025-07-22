import { writable, get, derived } from 'svelte/store';
import type { Trip } from '$lib/server/db/schema';

interface TripEditForm {
	// Step 1: Destination
	destination: {
		id?: number;
		city: string;
		country: string;
		latitude?: number;
		longitude?: number;
	} | null;
	destinationId?: number;

	// Step 2: Dates
	startDate: Date | null;
	endDate: Date | null;

	// Step 3: Travelers
	adultsCount: number;
	childrenCount: number;
	babiesCount: number;

	// Step 4: Travel Style
	travelStyle: string;

	// Step 5: Budget
	minBudget: number | null;
	maxBudget: number | null;
	budget?: string;

	// Step 6: Activity
	activities?: string[];

	// Step 7: Additional Request
	customRequest: string;
	additionalRequest?: string;

	// Step 8: Files
	file?: File | null;
}

function createTripEditStore() {
	const { subscribe, set, update } = writable<TripEditForm>({
		destination: null,
		destinationId: undefined,
		startDate: null,
		endDate: null,
		adultsCount: 1,
		childrenCount: 0,
		babiesCount: 0,
		travelStyle: '',
		minBudget: null,
		maxBudget: null,
		budget: undefined,
		activities: [],
		customRequest: '',
		additionalRequest: undefined,
		file: null
	});

	return {
		subscribe,
		set,
		update,

		// Initialize from existing trip data
		initializeFromTrip: (trip: any) => {
			set({
				destination: trip.destination ? {
					id: trip.destination.id,
					city: trip.destination.city,
					country: trip.destination.country?.name || trip.destination.country,
					latitude: trip.destination.latitude,
					longitude: trip.destination.longitude
				} : null,
				destinationId: trip.destination?.id || trip.destinationId,
				startDate: trip.startDate ? new Date(trip.startDate) : null,
				endDate: trip.endDate ? new Date(trip.endDate) : null,
				adultsCount: trip.adultsCount || 1,
				childrenCount: trip.childrenCount || 0,
				babiesCount: trip.babiesCount || 0,
				travelStyle: trip.travelStyle || trip.tourType || '',
				minBudget: trip.minBudget || trip.budgetMin || null,
				maxBudget: trip.maxBudget || trip.budgetMax || null,
				budget: trip.budget,
				activities: trip.activities || [],
				customRequest: trip.customRequest || trip.additionalRequest || '',
				additionalRequest: trip.additionalRequest || trip.customRequest || '',
				file: null
			});
		},

		// Update specific step data
		updateStep: (step: keyof TripEditForm | string, data: any) => {
			update((form) => ({
				...form,
				[step]: data
			}));
		},

		// Get current form data
		getData: () => get({ subscribe }),

		// Reset form
		reset: () => {
			set({
				destination: null,
				destinationId: undefined,
				startDate: null,
				endDate: null,
				adultsCount: 1,
				childrenCount: 0,
				babiesCount: 0,
				travelStyle: '',
				minBudget: null,
				maxBudget: null,
				budget: undefined,
				activities: [],
				customRequest: '',
				additionalRequest: undefined,
				file: null
			});
		}
	};
}

export const tripEditForm = createTripEditStore();

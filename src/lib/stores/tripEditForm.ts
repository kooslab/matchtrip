import { writable, get } from 'svelte/store';
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
	
	// Step 2: Dates
	startDate: Date | null;
	endDate: Date | null;
	
	// Step 3: Travelers
	adultsCount: number;
	childrenCount: number;
	
	// Step 4: Travel Style
	tourType: string;
	
	// Step 5: Budget
	minBudget: number | null;
	maxBudget: number | null;
	
	// Step 6: Transportation
	travelMethod: string;
	needsDriver: boolean;
	
	// Step 7: Accommodation
	accommodationType?: string;
	accommodationPreferences?: string;
	
	// Step 8: Activities
	activities?: string[];
	interests?: string[];
	
	// Step 9: Special Requests
	customRequest: string;
}

function createTripEditStore() {
	const { subscribe, set, update } = writable<TripEditForm>({
		destination: null,
		startDate: null,
		endDate: null,
		adultsCount: 1,
		childrenCount: 0,
		tourType: '',
		minBudget: null,
		maxBudget: null,
		travelMethod: '',
		needsDriver: false,
		customRequest: ''
	});
	
	return {
		subscribe,
		set,
		update,
		
		// Initialize from existing trip data
		initializeFromTrip: (trip: any) => {
			set({
				destination: trip.destination || null,
				startDate: trip.startDate ? new Date(trip.startDate) : null,
				endDate: trip.endDate ? new Date(trip.endDate) : null,
				adultsCount: trip.adultsCount || 1,
				childrenCount: trip.childrenCount || 0,
				tourType: trip.tourType || '',
				minBudget: trip.minBudget || null,
				maxBudget: trip.maxBudget || null,
				travelMethod: trip.travelMethod || '',
				needsDriver: trip.needsDriver || false,
				customRequest: trip.customRequest || '',
				accommodationType: trip.accommodationType,
				accommodationPreferences: trip.accommodationPreferences,
				activities: trip.activities,
				interests: trip.interests
			});
		},
		
		// Update specific step data
		updateStep: (step: keyof TripEditForm | string, data: any) => {
			update(form => ({
				...form,
				[step]: data
			}));
		},
		
		// Get current form data
		getData: () => get({ subscribe })
	};
}

export const tripEditForm = createTripEditStore();
import { writable, get } from 'svelte/store';

interface TripCreateForm {
	// Step 1: Destination
	destination: string | null;
	destinationId: number | null;
	
	// Step 2: Dates
	startDate: string | null;
	endDate: string | null;
	
	// Step 3: Travelers
	adultsCount: number;
	childrenCount: number;
	babiesCount: number;
	
	// Step 4: Budget
	budget: {
		id: string;
		name: string;
		min: number | null;
		max: number | null;
	} | null;
	
	// Step 5: Travel Style
	travelStyle: {
		id: string;
		name: string;
	} | null;
	
	// Step 6: Activities
	activities: string[];
	
	// Step 7: Additional Request
	additionalRequest: string;
	
	// Step 8: File
	file: File | null;
}

function createTripCreateStore() {
	const { subscribe, set, update } = writable<TripCreateForm>({
		destination: null,
		destinationId: null,
		startDate: null,
		endDate: null,
		adultsCount: 1,
		childrenCount: 0,
		babiesCount: 0,
		budget: null,
		travelStyle: null,
		activities: [],
		additionalRequest: '',
		file: null
	});
	
	return {
		subscribe,
		set,
		update,
		
		// Update specific step data
		updateStep: (step: keyof TripCreateForm | string, data: any) => {
			update(form => ({
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
				destinationId: null,
				startDate: null,
				endDate: null,
				adultsCount: 1,
				childrenCount: 0,
				babiesCount: 0,
				budget: null,
				travelStyle: null,
				activities: [],
				additionalRequest: '',
				file: null
			});
		}
	};
}

export const tripCreateForm = createTripCreateStore();
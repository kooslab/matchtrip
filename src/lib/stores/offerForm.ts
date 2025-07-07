import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface ItineraryDay {
	day: number;
	imageUrl?: string;
	timeSlots: {
		time: string;
		title: string;
		description: string;
	}[];
}

export interface OfferFormData {
	tripId: string;
	pricePerPerson: string;
	description: string;
	itinerary: ItineraryDay[];
	additionalFiles: File[];
}

// Create the store with default values
function createOfferFormStore() {
	const defaultData: OfferFormData = {
		tripId: '',
		pricePerPerson: '',
		description: '',
		itinerary: [
			{
				day: 1,
				imageUrl: '',
				timeSlots: []
			}
		],
		additionalFiles: []
	};

	// Load from localStorage if available
	const stored = browser ? localStorage.getItem('offerFormData') : null;
	const initialData = stored ? JSON.parse(stored) : defaultData;

	const { subscribe, set, update } = writable<OfferFormData>(initialData);

	// Save to localStorage whenever the store updates
	if (browser) {
		subscribe((value) => {
			// Don't store files in localStorage
			const dataToStore = { ...value, additionalFiles: [] };
			localStorage.setItem('offerFormData', JSON.stringify(dataToStore));
		});
	}

	return {
		subscribe,
		update,
		set,
		reset: () => {
			set(defaultData);
			if (browser) {
				localStorage.removeItem('offerFormData');
			}
		},
		setTripId: (tripId: string) => update((data) => ({ ...data, tripId })),
		setPricePerPerson: (price: string) => update((data) => ({ ...data, pricePerPerson: price })),
		setDescription: (description: string) => update((data) => ({ ...data, description })),
		addItineraryDay: () =>
			update((data) => ({
				...data,
				itinerary: [
					...data.itinerary,
					{
						day: data.itinerary.length + 1,
						imageUrl: '',
						timeSlots: []
					}
				]
			})),
		removeItineraryDay: (index: number) =>
			update((data) => {
				const newItinerary = data.itinerary.filter((_, i) => i !== index);
				// Renumber days
				newItinerary.forEach((day, i) => {
					day.day = i + 1;
				});
				return { ...data, itinerary: newItinerary };
			}),
		updateItineraryDay: (index: number, day: ItineraryDay) =>
			update((data) => {
				const newItinerary = [...data.itinerary];
				newItinerary[index] = day;
				return { ...data, itinerary: newItinerary };
			}),
		addFiles: (files: File[]) =>
			update((data) => ({ ...data, additionalFiles: [...data.additionalFiles, ...files] })),
		removeFile: (index: number) =>
			update((data) => ({
				...data,
				additionalFiles: data.additionalFiles.filter((_, i) => i !== index)
			}))
	};
}

export const offerFormStore = createOfferFormStore();

// Derived store for validation state
export const offerFormValidation = derived(offerFormStore, ($store) => ({
	isPriceValid: $store.pricePerPerson.trim() !== '',
	isDescriptionValid: $store.description.trim() !== '',
	canSubmit:
		$store.tripId !== '' && $store.pricePerPerson.trim() !== '' && $store.description.trim() !== ''
}));

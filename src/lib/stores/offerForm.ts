import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface OfferFormData {
	tripId: string;
	pricePerPerson: string;
	description: string;
	descriptionImages: string[]; // URLs of uploaded images
	additionalFiles: File[];
}

// Create the store with default values
function createOfferFormStore() {
	const defaultData: OfferFormData = {
		tripId: '',
		pricePerPerson: '',
		description: '',
		descriptionImages: [],
		additionalFiles: []
	};

	// Load from localStorage if available
	const stored = browser ? localStorage.getItem('offerFormData') : null;
	const initialData = stored ? { ...defaultData, ...JSON.parse(stored) } : defaultData;
	
	// Ensure descriptionImages is always an array
	if (!Array.isArray(initialData.descriptionImages)) {
		initialData.descriptionImages = [];
	}

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
		addDescriptionImage: (imageUrl: string) => 
			update((data) => ({ 
				...data, 
				descriptionImages: [...(data.descriptionImages || []), imageUrl] 
			})),
		removeDescriptionImage: (index: number) =>
			update((data) => ({
				...data,
				descriptionImages: (data.descriptionImages || []).filter((_, i) => i !== index)
			})),
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
export const offerFormValidation = derived(offerFormStore, ($store) => {
	// Strip HTML tags to check if there's actual content
	const stripHtml = (html: string) => {
		if (!browser) {
			// Simple regex fallback for server-side
			return html.replace(/<[^>]*>?/gm, '');
		}
		const tmp = document.createElement('div');
		tmp.innerHTML = html;
		return tmp.textContent || tmp.innerText || '';
	};
	
	const hasDescription = stripHtml($store.description).trim() !== '';
	
	return {
		isPriceValid: $store.pricePerPerson.trim() !== '',
		isDescriptionValid: hasDescription,
		canSubmit:
			$store.tripId !== '' && $store.pricePerPerson.trim() !== '' && hasDescription
	};
});

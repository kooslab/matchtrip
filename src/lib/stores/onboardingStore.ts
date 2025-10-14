import { writable } from 'svelte/store';

interface OnboardingData {
	name: string;
	phone: string;
	countryCode: string;  // Country code stored separately (e.g., "+49", "+82")
	nickname?: string;
	email?: string;
	birthDate?: string;
	profileImage?: string;
	profileImageUrl?: string;
	frequentArea?: string;
	gender?: string;
	bio?: string;
	destinations?: string[];
	uploadedFiles?: Record<string, File[]>;
}

function createOnboardingStore() {
	const { subscribe, set, update } = writable<OnboardingData>({
		name: '',
		phone: '',
		countryCode: ''  // No default - must be set during onboarding
	});

	let currentValue: OnboardingData = { name: '', phone: '', countryCode: '' };

	// Subscribe to store changes to keep currentValue updated
	subscribe((value) => {
		currentValue = value;
	});

	return {
		subscribe,
		get: () => currentValue,
		setField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
			update((data) => ({ ...data, [field]: value }));
		},
		setData: (data: Partial<OnboardingData>) => {
			update((current) => ({ ...current, ...data }));
		},
		reset: () => set({ name: '', phone: '', countryCode: '' })
	};
}

export const onboardingStore = createOnboardingStore();

import { writable } from 'svelte/store';

interface OnboardingData {
	name: string;
	phone: string;
	nickname?: string;
	email?: string;
	birthDate?: string;
	profileImage?: string;
}

function createOnboardingStore() {
	const { subscribe, set, update } = writable<OnboardingData>({
		name: '',
		phone: ''
	});

	return {
		subscribe,
		setField: <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
			update(data => ({ ...data, [field]: value }));
		},
		setData: (data: Partial<OnboardingData>) => {
			update(current => ({ ...current, ...data }));
		},
		reset: () => set({ name: '', phone: '' })
	};
}

export const onboardingStore = createOnboardingStore();
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string;
				role: string | null;
				name: string;
				email: string;
				emailVerified: boolean;
				phone?: string | null;
				birthDate?: string | null;
				onboardingCompleted?: boolean;
				guideProfile?: {
					isVerified: boolean;
				} | null;
			};
			session?: any;
			hasAgreedToTerms?: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

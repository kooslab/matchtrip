// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: {
				id: string;
				role: string;
				name: string;
				email: string;
			};
			session?: any;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};

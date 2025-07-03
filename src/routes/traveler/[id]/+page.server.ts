import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	try {
		const response = await fetch(`/api/traveler/${params.id}`);

		if (!response.ok) {
			return {
				traveler: null,
				travelerProfile: null
			};
		}

		const data = await response.json();

		return {
			traveler: data.traveler,
			travelerProfile: data.travelerProfile
		};
	} catch (error) {
		console.error('Error loading traveler profile:', error);
		return {
			traveler: null,
			travelerProfile: null
		};
	}
};

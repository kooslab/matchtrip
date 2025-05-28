import { writable } from 'svelte/store';

export const tripForm = writable({
	search: '',
	dateRange: { start: undefined as any, end: undefined as any },
	people: 1,
	tourType: ''
});

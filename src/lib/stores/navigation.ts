import { writable } from 'svelte/store';

export const navigationLoading = writable(false);
export const currentRoute = writable('');

export function setNavigationLoading(loading: boolean) {
	navigationLoading.set(loading);
}

export function setCurrentRoute(route: string) {
	currentRoute.set(route);
}

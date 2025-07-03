import { resetRole } from './userRole';
import { tripForm } from './tripForm';
import { locationStore } from './location';
import { navigationLoading, currentRoute } from './navigation';

export function resetAllStores() {
	// Reset user role
	resetRole();

	// Reset trip form to initial state
	tripForm.set({
		search: '',
		dateRange: { start: undefined as any, end: undefined as any },
		people: 1,
		tourType: '',
		selectedCity: undefined as any
	});

	// Reset location store
	locationStore.reset();

	// Reset navigation state
	navigationLoading.set(false);
	currentRoute.set('');
}

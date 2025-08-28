import { writable } from 'svelte/store';

interface PWAState {
	isInstallable: boolean;
	isInstalled: boolean;
	isOnline: boolean;
	showInstallPrompt: boolean;
	deferredPrompt: any;
}

function createPWAStore() {
	const initialState: PWAState = {
		isInstallable: false,
		isInstalled: false,
		isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
		showInstallPrompt: false,
		deferredPrompt: null
	};

	const { subscribe, set, update } = writable<PWAState>(initialState);

	// Check if app is already installed
	const checkInstalled = () => {
		if (typeof window !== 'undefined') {
			// Check if app is running in standalone mode
			const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
			// @ts-ignore - navigator.standalone is iOS specific
			const isIOSStandalone = window.navigator.standalone === true;
			
			update(state => ({
				...state,
				isInstalled: isStandalone || isIOSStandalone
			}));
		}
	};

	// Initialize PWA functionality
	const init = () => {
		if (typeof window === 'undefined') return;

		// Check if already installed
		checkInstalled();

		// Listen for beforeinstallprompt event
		window.addEventListener('beforeinstallprompt', (e: any) => {
			// Prevent the default prompt
			e.preventDefault();
			
			// Store the event for later use
			update(state => ({
				...state,
				deferredPrompt: e,
				isInstallable: true,
				showInstallPrompt: !state.isInstalled && !localStorage.getItem('pwa-install-dismissed')
			}));
		});

		// Listen for app installed event
		window.addEventListener('appinstalled', () => {
			update(state => ({
				...state,
				isInstalled: true,
				isInstallable: false,
				showInstallPrompt: false,
				deferredPrompt: null
			}));
		});

		// Listen for online/offline events
		window.addEventListener('online', () => {
			update(state => ({ ...state, isOnline: true }));
		});

		window.addEventListener('offline', () => {
			update(state => ({ ...state, isOnline: false }));
		});
	};

	// Install the app
	const install = async () => {
		let installed = false;
		
		update(state => {
			if (state.deferredPrompt) {
				// Show the install prompt
				state.deferredPrompt.prompt();
				
				// Wait for the user's response
				state.deferredPrompt.userChoice.then((choiceResult: any) => {
					if (choiceResult.outcome === 'accepted') {
						console.log('User accepted the install prompt');
						installed = true;
					} else {
						console.log('User dismissed the install prompt');
					}
					
					// Clear the deferred prompt
					update(s => ({
						...s,
						deferredPrompt: null,
						showInstallPrompt: false
					}));
				});
			}
			
			return state;
		});
		
		return installed;
	};

	// Dismiss the install prompt
	const dismissPrompt = () => {
		localStorage.setItem('pwa-install-dismissed', 'true');
		update(state => ({
			...state,
			showInstallPrompt: false
		}));
	};

	// Reset dismissed status (for testing or re-prompting later)
	const resetDismissed = () => {
		localStorage.removeItem('pwa-install-dismissed');
		update(state => ({
			...state,
			showInstallPrompt: state.isInstallable && !state.isInstalled
		}));
	};

	return {
		subscribe,
		init,
		install,
		dismissPrompt,
		resetDismissed,
		checkInstalled
	};
}

export const pwaStore = createPWAStore();
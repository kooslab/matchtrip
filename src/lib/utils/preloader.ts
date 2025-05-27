import { preloadData } from '$app/navigation';

// Common routes that users frequently visit
const COMMON_ROUTES = ['/my-trips', '/trips', '/my-offers'];

export function preloadCommonRoutes() {
	// Preload common routes after a short delay
	setTimeout(() => {
		COMMON_ROUTES.forEach((route) => {
			preloadData(route).catch(() => {
				// Silently fail - preloading is optional
			});
		});
	}, 1000);
}

export function preloadRoute(route: string) {
	preloadData(route).catch(() => {
		// Silently fail - preloading is optional
	});
}

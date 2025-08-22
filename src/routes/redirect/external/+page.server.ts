import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Whitelist of allowed paths to prevent open redirect vulnerability
const ALLOWED_PATHS = [
	'/profile/traveler',
	'/profile/guide',
	'/my-trips',
	'/my-offers',
	'/chat',
	'/settlement',
	'/contact',
	'/messages' // Alternative chat path
];

// Allowed domains for production and development
const ALLOWED_DOMAINS = [
	'https://matchtrip.net',
	'https://dev.matchtrip.net',
	'http://localhost:5173', // For local development
	'http://localhost:5174'
];

export const load: PageServerLoad = async ({ url }) => {
	// Get the target path from query parameter
	const targetPath = url.searchParams.get('to');
	
	// Validate the target path
	if (!targetPath) {
		// If no target, redirect to home
		throw redirect(302, '/');
	}
	
	// Ensure the path starts with /
	const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
	
	// Check if the path is in our whitelist
	const isAllowedPath = ALLOWED_PATHS.some(allowed => 
		normalizedPath === allowed || normalizedPath.startsWith(`${allowed}/`)
	);
	
	if (!isAllowedPath) {
		console.warn(`Attempted redirect to non-whitelisted path: ${normalizedPath}`);
		throw redirect(302, '/');
	}
	
	// Get the current domain
	const currentProtocol = url.protocol;
	const currentHost = url.host;
	const currentDomain = `${currentProtocol}//${currentHost}`;
	
	// Build the full redirect URL
	const redirectUrl = `${currentDomain}${normalizedPath}`;
	
	// Log for debugging
	console.log(`External redirect from Kakao: ${redirectUrl}`);
	
	// Perform the redirect with headers to encourage external browser
	// Note: These headers might help but aren't guaranteed to force external browser
	throw redirect(302, redirectUrl);
};
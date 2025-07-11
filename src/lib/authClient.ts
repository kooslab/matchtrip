import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';

// Dynamic base URL that works in both dev and production
const getBaseUrl = () => {
	if (typeof window !== 'undefined') {
		// In browser environments, use the environment variable or current origin
		const url = env.PUBLIC_BETTER_AUTH_URL || window.location.origin;
		console.log('[AUTH CLIENT] Browser - Base URL:', url);
		console.log('[AUTH CLIENT] Browser - env.PUBLIC_BETTER_AUTH_URL:', env.PUBLIC_BETTER_AUTH_URL);
		console.log('[AUTH CLIENT] Browser - window.location.origin:', window.location.origin);
		return url;
	}
	// In SSR, use environment variable or localhost as fallback
	const url = env.PUBLIC_BETTER_AUTH_URL || 'http://localhost:5173';
	console.log('[AUTH CLIENT] SSR - Base URL:', url);
	console.log('[AUTH CLIENT] SSR - env.PUBLIC_BETTER_AUTH_URL:', env.PUBLIC_BETTER_AUTH_URL);
	return url;
};

const baseURL = getBaseUrl();
console.log('[AUTH CLIENT] Creating auth client with baseURL:', baseURL);

export const authClient = createAuthClient({
	baseURL // dynamically determine the base URL
});

// Export the session store and methods
export const { signIn, signOut, useSession } = authClient;

// Export the session store directly for component usage
export const session = authClient.$session;

// Add session debugging only in browser
if (typeof window !== 'undefined') {
	authClient.getSession().then((s) => {
		console.log('[AUTH CLIENT] Initial session check:', s);
	}).catch((error) => {
		console.error('[AUTH CLIENT] Session check error:', error);
	});
}

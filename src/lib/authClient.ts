import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';

// Dynamic base URL that works in both dev and production
const getBaseUrl = () => {
	if (typeof window !== 'undefined') {
		// In browser environments, use the environment variable or current origin
		return env.PUBLIC_BETTER_AUTH_URL || window.location.origin;
	}
	// In SSR, use environment variable or localhost as fallback
	return env.PUBLIC_BETTER_AUTH_URL || 'http://localhost:5173';
};

export const { signIn, signOut, signUp, useSession } = createAuthClient({
	baseURL: getBaseUrl() // dynamically determine the base URL
});

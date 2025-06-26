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

export const { 
	signIn, 
	signOut, 
	signUp, 
	useSession,
	sendVerificationEmail,
	verifyEmail,
	forgetPassword,
	resetPassword
} = authClient;

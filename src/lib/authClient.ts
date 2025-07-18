import { createAuthClient } from 'better-auth/svelte';
import { env } from '$env/dynamic/public';
import { writable } from 'svelte/store';

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

// Create a writable store for the session
const sessionStore = writable<{ data: any; isPending: boolean }>({ data: null, isPending: true });

export const authClient = createAuthClient({
	baseURL // dynamically determine the base URL
});

// Get the original methods
const originalSignIn = authClient.signIn;
const originalSignOut = authClient.signOut;

// Create wrapped versions that update our session store
export const signIn = {
	social: async (...args: Parameters<typeof originalSignIn.social>) => {
		const result = await originalSignIn.social(...args);
		// Update session after sign in
		if (typeof window !== 'undefined') {
			const newSession = await authClient.getSession();
			sessionStore.set({ data: newSession, isPending: false });
		}
		return result;
	}
};

export const signOut = async (...args: Parameters<typeof originalSignOut>) => {
	const result = await originalSignOut(...args);
	// Clear session after sign out
	if (typeof window !== 'undefined') {
		sessionStore.set({ data: null, isPending: false });
	}
	return result;
};

export const { useSession } = authClient;

// Initialize session in browser only
if (typeof window !== 'undefined') {
	// Get initial session
	authClient
		.getSession()
		.then((initialSession) => {
			sessionStore.set({ data: initialSession, isPending: false });
		})
		.catch(() => {
			sessionStore.set({ data: null, isPending: false });
		});
}

// Export the session store for component usage
export const session = sessionStore;

// Add session debugging only in browser
if (typeof window !== 'undefined') {
	authClient
		.getSession()
		.then((s) => {
			console.log('[AUTH CLIENT] Initial session check:', s);
		})
		.catch((error) => {
			console.error('[AUTH CLIENT] Session check error:', error);
		});
}

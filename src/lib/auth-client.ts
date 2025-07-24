import { createAuthClient } from 'better-auth/client';
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';

const baseURL = PUBLIC_BETTER_AUTH_URL || 'http://localhost:5173';

export const authClient = createAuthClient({
	baseURL: `${baseURL}/api/auth`
});
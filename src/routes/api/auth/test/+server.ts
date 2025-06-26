import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET } from '$env/static/private';
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';

export const GET: RequestHandler = async ({ request }) => {
	try {
		// Check environment variables
		const envCheck = {
			GOOGLE_CLIENT_ID: !!GOOGLE_CLIENT_ID,
			GOOGLE_CLIENT_SECRET: !!GOOGLE_CLIENT_SECRET,
			BETTER_AUTH_SECRET: !!BETTER_AUTH_SECRET,
			PUBLIC_BETTER_AUTH_URL: PUBLIC_BETTER_AUTH_URL || 'not set'
		};

		// Try to get session
		let session = null;
		let sessionError = null;
		try {
			session = await auth.api.getSession({ headers: request.headers });
		} catch (err) {
			sessionError = err?.message || 'Unknown error';
		}

		// Get auth configuration info
		const authConfig = {
			hasGoogleProvider: !!auth.options?.socialProviders?.google,
			googleRedirectURI: `${PUBLIC_BETTER_AUTH_URL || 'http://localhost:5173'}/api/auth/callback/google`,
			trustedOrigins: auth.options?.trustedOrigins || []
		};

		return json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			environment: envCheck,
			session: session ? {
				userId: session.user?.id,
				email: session.user?.email,
				hasSession: true
			} : {
				hasSession: false,
				error: sessionError
			},
			authConfig
		});
	} catch (error) {
		console.error('[AUTH TEST] Error:', error);
		return json({
			status: 'error',
			error: error?.message || 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};
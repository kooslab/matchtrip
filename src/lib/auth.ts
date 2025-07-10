import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';
import * as schema from './server/db/schema';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BETTER_AUTH_SECRET } from '$env/static/private';
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';
import { authErrorLogger } from './utils/authErrorLogger';

const getAuthUrl = () => {
	const url = PUBLIC_BETTER_AUTH_URL || 'http://localhost:5173';
	console.log('[AUTH CONFIG] Auth URL:', url);
	console.log('[AUTH CONFIG] PUBLIC_BETTER_AUTH_URL:', PUBLIC_BETTER_AUTH_URL);
	return url;
};

// Validate required environment variables
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
	authErrorLogger.log('config', 'Missing Google OAuth credentials', {
		GOOGLE_CLIENT_ID_exists: !!GOOGLE_CLIENT_ID,
		GOOGLE_CLIENT_SECRET_exists: !!GOOGLE_CLIENT_SECRET
	});
}

if (!BETTER_AUTH_SECRET) {
	authErrorLogger.log('config', 'Missing BETTER_AUTH_SECRET - authentication may fail');
}

// Log database connection
console.log('[AUTH CONFIG] Initializing better-auth with drizzle adapter');
console.log('[AUTH CONFIG] Database tables available:', Object.keys(db._.schema || {}));

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			users: schema.users,
			sessions: schema.sessions,
			accounts: schema.accounts,
			verifications: schema.verifications
		}
	}),
	secret: BETTER_AUTH_SECRET,
	advanced: {
		generateId: false,
		// Add debugging
		debugMode: true
	},
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			redirectURI: `${getAuthUrl()}/api/auth/callback/google`,
			prompt: 'select_account', // Force account selection on each login
			// Add state parameter to track OAuth flow
			scope: ['openid', 'email', 'profile'],
			// Map Google profile data to our user schema
			mapProfileToUser: (profile) => {
				console.log('[GOOGLE OAUTH] Mapping profile:', JSON.stringify(profile, null, 2));
				const mappedUser = {
					name: profile.name || profile.email,
					email: profile.email,
					emailVerified: true, // Google accounts are pre-verified
					image: profile.picture || profile.image
				};
				console.log('[GOOGLE OAUTH] Mapped user data:', JSON.stringify(mappedUser, null, 2));
				return mappedUser;
			}
		}
	},
	rateLimit: {
		storage: 'memory'
	},
	user: { modelName: 'users' },
	session: { 
		modelName: 'sessions',
		expiresIn: 60 * 60 * 24 * 30, // 30 days
		updateAge: 60 * 60 * 24, // Update session every 24 hours
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5 // Cache for 5 minutes
		}
	},
	account: { modelName: 'accounts' },
	verification: { modelName: 'verifications' },
	trustedOrigins: [
		'https://matchtrip-johnny-ilmo-koos-projects.vercel.app',
		'https://matchtrip.vercel.app',
		// Add any other domains you might deploy to
		'http://localhost:5173', // For local development,
		'https://dev.matchtrip.net', // dev environment
		'https://matchtrip.net', // production
		'https://www.matchtrip.net' // production
	],
	// Add request logging
	onRequest: async (request) => {
		const url = new URL(request.url);
		console.log('[AUTH REQUEST]', request.method, url.pathname);
		console.log('[AUTH REQUEST] Search params:', url.searchParams.toString());

		if (
			request.method === 'POST' &&
			request.headers.get('content-type')?.includes('application/json')
		) {
			try {
				const body = await request.clone().json();
				console.log('[AUTH REQUEST] Body:', JSON.stringify(body, null, 2));
			} catch (e) {
				console.log('[AUTH REQUEST] Could not parse body as JSON');
			}
		}
	},
	// Add response logging
	onResponse: async (response) => {
		console.log('[AUTH RESPONSE] Status:', response.status);
		console.log('[AUTH RESPONSE] Headers:', Object.fromEntries(response.headers.entries()));
		
		// Log successful responses too for debugging
		if (response.status >= 200 && response.status < 300) {
			try {
				const body = await response.clone().json();
				console.log('[AUTH RESPONSE] Success body:', JSON.stringify(body, null, 2));
			} catch (e) {
				console.log('[AUTH RESPONSE] Response is not JSON');
			}
		}
		
		if (response.status >= 400) {
			try {
				const body = await response.clone().json();
				console.error('[AUTH RESPONSE] Error body:', JSON.stringify(body, null, 2));
			} catch (e) {
				console.error('[AUTH RESPONSE] Could not parse error body');
			}
		}
	}
});

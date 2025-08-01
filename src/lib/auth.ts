import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth } from 'better-auth/plugins';
import { db } from './server/db';
import * as schema from './server/db/schema';
import {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	BETTER_AUTH_SECRET,
	KAKAO_REST_API_KEY,
	KAKAO_CLIENT_SECRET
} from '$env/static/private';
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

if (!KAKAO_REST_API_KEY || !KAKAO_CLIENT_SECRET) {
	authErrorLogger.log('config', 'Missing Kakao OAuth credentials', {
		KAKAO_REST_API_KEY_exists: !!KAKAO_REST_API_KEY,
		KAKAO_CLIENT_SECRET_exists: !!KAKAO_CLIENT_SECRET
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
		debugMode: true,
		// Force secure cookies in production
		useSecureCookies: process.env.NODE_ENV === 'production',
		// Cookie configuration for better Safari compatibility
		defaultCookieAttributes: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax' as const, // 'lax' instead of 'none' for Safari compatibility
			path: '/',
			// Extend cookie lifetime
			maxAge: 60 * 60 * 24 * 30 // 30 days
		}
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
					image: profile.picture
				};
				console.log('[GOOGLE OAUTH] Mapped user data:', JSON.stringify(mappedUser, null, 2));
				return mappedUser;
			}
		}
	},
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: 'kakao',
					clientId: KAKAO_REST_API_KEY,
					clientSecret: KAKAO_CLIENT_SECRET,
					authorizationUrl: 'https://kauth.kakao.com/oauth/authorize',
					tokenUrl: 'https://kauth.kakao.com/oauth/token',
					userInfoUrl: 'https://kapi.kakao.com/v2/user/me',
					redirectURI: `${getAuthUrl()}/api/auth/callback/kakao`,
					scope: ['account_email', 'profile_nickname', 'profile_image'],
					// Add property_keys to specifically request email and prompt for consent
					additionalParams: {
						prompt: 'login' // Forces the consent screen to appear
					},
					// Add custom getUserInfo that properly requests email from Kakao
					getUserInfo: async (data) => {
						console.log('[KAKAO OAUTH] Custom getUserInfo called');
						const accessToken = data.accessToken || data.access_token || data;

						try {
							// Make request to Kakao API with property_keys
							const propertyKeys = ['kakao_account.email', 'kakao_account.profile'];
							const response = await fetch('https://kapi.kakao.com/v2/user/me', {
								method: 'POST',
								headers: {
									Authorization: `Bearer ${accessToken}`,
									'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
								},
								body: new URLSearchParams({
									property_keys: JSON.stringify(propertyKeys)
								})
							});

							if (!response.ok) {
								const errorText = await response.text();
								throw new Error(`Kakao API error: ${response.status} - ${errorText}`);
							}

							const userData = await response.json();
							console.log(
								'[KAKAO OAUTH] Got user data from Kakao:',
								JSON.stringify(userData, null, 2)
							);

							// Better-auth expects email at the top level of the returned object
							// Extract and normalize the data
							const email = userData.kakao_account?.email;
							if (!email) {
								throw new Error('Email not provided by Kakao');
							}

							const normalizedUser = {
								id: userData.id?.toString(),
								email: email,
								name: userData.kakao_account?.profile?.nickname || 'Kakao User',
								image: userData.kakao_account?.profile?.profile_image_url,
								emailVerified: userData.kakao_account?.is_email_verified || false,
								// Pass the full data for mapProfileToUser if needed
								kakao_account: userData.kakao_account
							};

							console.log(
								'[KAKAO OAUTH] Returning normalized user data:',
								JSON.stringify(normalizedUser, null, 2)
							);
							return normalizedUser;
						} catch (error) {
							console.error('[KAKAO OAUTH] Error in getUserInfo:', error);
							throw error;
						}
					},
					mapProfileToUser: async (profile) => {
						console.log(
							'[KAKAO OAUTH] mapProfileToUser called with:',
							JSON.stringify(profile, null, 2)
						);

						// Since getUserInfo already normalized the data, we can use it directly
						// Check if this is already normalized data or raw Kakao data
						if (profile.email && profile.id) {
							// Already normalized by getUserInfo
							console.log('[KAKAO OAUTH] Using pre-normalized user data');
							return {
								email: profile.email,
								name: profile.name,
								image: profile.image,
								emailVerified: profile.emailVerified
							};
						}

						// Fallback for raw Kakao data (shouldn't happen with our getUserInfo)
						const kakaoAccount = profile.kakao_account || {};
						if (!kakaoAccount.email) {
							throw new Error('Email not provided by Kakao');
						}

						return {
							email: kakaoAccount.email,
							name: kakaoAccount.profile?.nickname || 'Kakao User',
							image: kakaoAccount.profile?.profile_image_url,
							emailVerified: kakaoAccount.is_email_verified || false
						};
					}
				}
			]
		})
	],
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
	onRequest: async (request: Request) => {
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
	onResponse: async (response: Response) => {
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

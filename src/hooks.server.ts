import { auth } from '$lib/auth';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, userAgreements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import { authErrorLogger } from '$lib/utils/authErrorLogger';

const corsHandler = (async ({ event, resolve }) => {
	// Handle CORS for API routes
	if (event.url.pathname.startsWith('/api/')) {
		const allowedOrigins = [
			'http://localhost:5173',
			'http://localhost:5174',
			'https://matchtrip.net',
			'https://www.matchtrip.net',
			'https://dev.matchtrip.net'
		];

		const origin = event.request.headers.get('origin') || '';
		
		// In development, be more permissive
		const isAllowed = dev ? origin.includes('localhost') : allowedOrigins.includes(origin);
		const allowOrigin = isAllowed ? origin : allowedOrigins[0];

		// Handle preflight requests
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': allowOrigin,
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization',
					'Access-Control-Allow-Credentials': 'true',
					'Access-Control-Max-Age': '86400'
				}
			});
		}

		// Add CORS headers to the response
		const response = await resolve(event);
		response.headers.set('Access-Control-Allow-Origin', allowOrigin);
		response.headers.set('Access-Control-Allow-Credentials', 'true');
		return response;
	}

	return resolve(event);
}) satisfies Handle;

const betterAuthHandler = (async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth });
}) satisfies Handle;

const authorizationHandler = (async ({ event, resolve }) => {
	let routeId: string | null = null;
	let session: any = null;

	try {
		routeId = event.route.id;
		session = await auth.api.getSession({ headers: event.request.headers });

		// Clean up locals first to ensure no stale data
		event.locals.session = undefined;
		event.locals.user = undefined;
		
		// Store session in locals for use in page server functions
		if (session) {
			event.locals.session = session;
			console.log('[HOOKS] Session found for user:', session.user?.email);
		}

		// If user is logged in, fetch their full user data including role
		if (session?.user?.id) {
			try {
				// Fetch user from database
				const user = await db.query.users.findFirst({
					where: eq(users.id, session.user.id),
					columns: {
						id: true,
						role: true,
						name: true,
						email: true,
						emailVerified: true,
						phone: true,
						birthDate: true
					}
				});

				if (user) {
					event.locals.user = user;
					console.log('Hooks - User loaded in locals:', user.email, 'Role:', user.role, 'EmailVerified:', user.emailVerified);
					
					// Check if user has agreed to terms
					const agreement = await db.query.userAgreements.findFirst({
						where: eq(userAgreements.userId, user.id),
						columns: {
							termsAgreed: true,
							privacyAgreed: true
						}
					});
					
					// Check if user has agreed to terms
					event.locals.hasAgreedToTerms = !!(agreement?.termsAgreed && agreement?.privacyAgreed);
				}
			} catch (error) {
				authErrorLogger.log('db', 'Failed to fetch user from database', {
					userId: session.user.id,
					error: error instanceof Error ? error.message : String(error)
				}, error as Error);
			}
		}
	} catch (error) {
		authErrorLogger.log('session', 'Critical error in session handling', {
			route: routeId,
			error: error instanceof Error ? error.message : String(error),
			url: event.url.pathname
		}, error as Error);
		// Clean up session data on error
		event.locals.session = undefined;
		event.locals.user = undefined;
		// Don't process route protection if we had an error
		return resolve(event);
	}

	// Handle auth route redirects - redirect to role-based pages
	if (routeId?.startsWith('/(auth)') && session && event.locals.user) {
		// First check if user has agreed to terms
		if (!event.locals.hasAgreedToTerms) {
			redirect(302, '/agreement');
		}
		// Then check if user has a role (Google OAuth users might not have one)
		else if (!event.locals.user.role) {
			redirect(302, '/select-role');
		} else if (event.locals.user.role === 'admin') {
			redirect(302, '/admin');
		} else if (event.locals.user.role === 'guide') {
			redirect(302, '/trips');
		} else {
			redirect(302, '/my-trips');
		}
	}

	// Handle OAuth callback redirects - when coming from Google OAuth
	if (routeId === '/' && session && event.locals.user && event.request.headers.get('referer')?.includes('/api/auth/callback/google')) {
		// First check if user has agreed to terms
		if (!event.locals.hasAgreedToTerms) {
			redirect(302, '/agreement');
		}
		// Then check if user has a role (Google OAuth users might not have one)
		else if (!event.locals.user.role) {
			redirect(302, '/select-role');
		} else if (event.locals.user.role === 'admin') {
			redirect(302, '/admin');
		} else if (event.locals.user.role === 'guide') {
			redirect(302, '/my-offers');
		} else {
			redirect(302, '/my-trips');
		}
	}

	// Check if user needs to agree to terms first
	if (session && event.locals.user && !event.locals.hasAgreedToTerms && routeId !== '/agreement' && !routeId?.startsWith('/api') && !routeId?.startsWith('/terms')) {
		redirect(302, '/agreement');
	}

	// Check if user needs to select a role (for Google OAuth users)
	if (session && event.locals.user && event.locals.hasAgreedToTerms && !event.locals.user.role && routeId !== '/select-role' && !routeId?.startsWith('/api')) {
		redirect(302, '/select-role');
	}


	// Handle protected app routes that require authentication
	const isAppRoute = routeId?.startsWith('/(app)');
	if (isAppRoute && !session?.user) {
		redirect(302, '/signin');
	}

	// Handle protected routes that require specific roles (guide-only routes)
	const guideOnlyRoutes = ['/(app)/trips', '/(app)/offers', '/(app)/my-offers'];
	const isGuideOnlyRoute = guideOnlyRoutes.some((route) => routeId?.includes(route));
	const isAdminRoute = routeId?.startsWith('/admin');

	// Allow admin users to access any route
	if (event.locals.user?.role === 'admin') {
		return resolve(event);
	}

	if (
		isGuideOnlyRoute &&
		!isAdminRoute &&
		!routeId?.startsWith('/api') &&
		(!event.locals.user || event.locals.user.role !== 'guide')
	) {
		console.log('Hooks - Access denied to guide-only route. User role:', event.locals.user?.role);
		redirect(302, '/');
	}

	// Handle admin-only routes
	if (
		isAdminRoute &&
		!routeId?.startsWith('/api') &&
		(!event.locals.user || event.locals.user.role !== 'admin')
	) {
		console.log('Hooks - Access denied to admin route. User role:', event.locals.user?.role);
		redirect(302, '/');
	}

	return resolve(event);
}) satisfies Handle;

export const handle = sequence(corsHandler, betterAuthHandler, authorizationHandler);

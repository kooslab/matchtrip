import { auth } from '$lib/auth';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

const betterAuthHandler = (async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth });
}) satisfies Handle;

const authorizationHandler = (async ({ event, resolve }) => {
	let routeId: string | null = null;
	let session: any = null;

	try {
		routeId = event.route.id;
		session = await auth.api.getSession({ headers: event.request.headers });

		// Store session in locals for use in page server functions
		event.locals.session = session;

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
						emailVerified: true
					}
				});

				if (user) {
					event.locals.user = user;
					console.log('Hooks - User loaded in locals:', user.email, 'Role:', user.role, 'Verified:', user.emailVerified);
				}
			} catch (error) {
				console.error('Hooks - Failed to fetch user:', error);
			}
		}
	} catch (error) {
		console.error('Hooks - Critical error in session handling:', error);
		// Continue without session data
		event.locals.session = undefined;
		event.locals.user = undefined;
		// Don't process route protection if we had an error
		return resolve(event);
	}

	// Handle auth route redirects - redirect to role-based pages
	if (routeId?.startsWith('/(auth)') && session && event.locals.user) {
		if (event.locals.user.role === 'guide') {
			redirect(302, '/trips');
		} else {
			redirect(302, '/my-trips');
		}
	}

	// Check email verification for protected routes (exclude verify-email and API routes)
	const unverifiedAllowedRoutes = ['/verify-email', '/api', '/(auth)'];
	const isUnverifiedAllowed = unverifiedAllowedRoutes.some((route) => routeId?.includes(route));
	
	if (session?.user && event.locals.user && !event.locals.user.emailVerified && !isUnverifiedAllowed) {
		console.log('Hooks - User email not verified, redirecting to verify page');
		redirect(302, '/verify-email');
	}

	// Handle protected routes that require authentication (exclude API routes)
	if (routeId?.includes('/my-trips') && !routeId?.startsWith('/api') && !session?.user) {
		redirect(302, '/signin');
	}

	// Handle protected routes that require specific roles (guide-only routes, exclude API routes and admin routes)
	const guideOnlyRoutes = ['/trips', '/offers', '/my-offers'];
	const isGuideOnlyRoute = guideOnlyRoutes.some((route) => routeId?.includes(route));
	const isAdminRoute = routeId?.startsWith('/admin');

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

export const handle = sequence(betterAuthHandler, authorizationHandler);

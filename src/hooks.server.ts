import * as Sentry from '@sentry/sveltekit';
import { json, redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { SENTRY_DSN } from '$env/static/private';

// Initialize Sentry for server-side error tracking
Sentry.init({
	dsn: SENTRY_DSN,
	enabled: !dev,
	environment: dev ? 'development' : 'production',
	tracesSampleRate: 0,
	debug: false
});

// Service is paused: the production database has been shut down.
// Only pages that work without the database are served; everything else is
// redirected to the login page, where any login attempt shows a "service paused" notice.
// The previous auth/session hook is preserved in git history.

const PUBLIC_PAGES = ['/', '/login', '/contact'];
const PUBLIC_PAGE_PREFIXES = ['/terms'];
const PUBLIC_APIS = ['/api/destinations'];

function isPublicPage(pathname: string): boolean {
	return (
		PUBLIC_PAGES.includes(pathname) ||
		PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
	);
}

const maintenanceHandler = (async ({ event, resolve }) => {
	const { pathname } = event.url;

	event.locals.session = undefined;
	event.locals.user = undefined;
	event.locals.hasAgreedToTerms = false;

	if (pathname.startsWith('/api/')) {
		if (PUBLIC_APIS.includes(pathname)) {
			return resolve(event);
		}
		return json({ error: 'Service is temporarily unavailable' }, { status: 503 });
	}

	if (!isPublicPage(pathname)) {
		redirect(302, '/login');
	}

	return resolve(event);
}) satisfies Handle;

export const handle = sequence(Sentry.sentryHandle(), maintenanceHandler);

// Handle errors and report to Sentry
export const handleError: HandleServerError = Sentry.handleErrorWithSentry(({ error, event }) => {
	console.error('[Server Error]', {
		url: event.url.pathname,
		method: event.request.method,
		error: error instanceof Error ? error.message : String(error)
	});

	return {
		message: 'An unexpected error occurred',
		code: 'INTERNAL_ERROR'
	};
});

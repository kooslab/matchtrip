import { auth } from '$lib/auth';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { redirect, type Handle } from '@sveltejs/kit';

const betterAuthHandler = (async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth });
}) satisfies Handle;

const authorizationHandler = (async ({ event, resolve }) => {
	const routeId = event.route.id;
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (routeId!.startsWith('/app') && !session) {
		console.log('user tried to access: ', routeId);
		console.log('No Session');
		console.log('redirecting to /signin');
		redirect(302, '/signin');
	}

	if (routeId!.startsWith('/(auth)') && session) {
		console.log('Session');
		console.log('user tried to access: ', routeId);
		console.log('redirecting to /app');
		redirect(302, '/app');
	}

	return resolve(event);
}) satisfies Handle;

export const handle = sequence(betterAuthHandler, authorizationHandler);

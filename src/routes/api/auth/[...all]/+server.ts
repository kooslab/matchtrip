import { auth } from '$lib/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event) => {
	console.log('[AUTH HANDLER] GET request to:', event.url.pathname);
	console.log('[AUTH HANDLER] GET params:', event.url.searchParams.toString());

	try {
		const response = await auth.handler(event.request);
		console.log('[AUTH HANDLER] GET response status:', response.status);
		return response;
	} catch (error) {
		console.error('[AUTH HANDLER] GET error:', error);
		console.error('[AUTH HANDLER] GET error details:', JSON.stringify(error, null, 2));
		throw error;
	}
};

export const POST: RequestHandler = async (event) => {
	console.log('[AUTH HANDLER] POST request to:', event.url.pathname);
	console.log('[AUTH HANDLER] POST headers:', Object.fromEntries(event.request.headers.entries()));

	try {
		const body = await event.request.clone().text();
		console.log('[AUTH HANDLER] POST body preview:', body.substring(0, 200));

		const response = await auth.handler(event.request);
		console.log('[AUTH HANDLER] POST response status:', response.status);

		// Log response body if it's an error
		if (response.status >= 400) {
			const responseBody = await response.clone().text();
			console.error('[AUTH HANDLER] Error response body:', responseBody);
		}

		return response;
	} catch (error) {
		console.error('[AUTH HANDLER] POST error:', error);
		console.error(
			'[AUTH HANDLER] POST error stack:',
			error instanceof Error ? error.stack : 'No stack'
		);
		console.error('[AUTH HANDLER] POST error details:', JSON.stringify(error, null, 2));
		
		// Return a proper error response instead of throwing
		return new Response(
			JSON.stringify({
				error: 'Authentication failed',
				message: error instanceof Error ? error.message : 'Unknown error',
				details: process.env.NODE_ENV === 'development' ? error : undefined
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		);
	}
};

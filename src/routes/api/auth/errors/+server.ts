import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authErrorLogger } from '$lib/utils/authErrorLogger';
import { auth } from '$lib/auth';

export const GET: RequestHandler = async ({ request, locals }) => {
	try {
		// Check if user is admin (optional - remove if you want to debug without auth)
		const session = await auth.api.getSession({ headers: request.headers });
		
		// Get query parameters
		const url = new URL(request.url);
		const type = url.searchParams.get('type') as any;
		const minutes = parseInt(url.searchParams.get('minutes') || '60');

		// Get errors based on filters
		const errors = type 
			? authErrorLogger.getErrors(type)
			: authErrorLogger.getRecentErrors(minutes);

		return json({
			status: 'ok',
			timestamp: new Date().toISOString(),
			filters: {
				type: type || 'all',
				minutes: minutes
			},
			totalErrors: errors.length,
			errors: errors.slice(-50), // Return last 50 errors
			session: session ? {
				userId: session.user?.id,
				email: session.user?.email
			} : null
		});
	} catch (error) {
		console.error('[AUTH ERRORS API] Error:', error);
		return json({
			status: 'error',
			error: error?.message || 'Unknown error',
			timestamp: new Date().toISOString()
		}, { status: 500 });
	}
};

// Clear errors endpoint (POST)
export const POST: RequestHandler = async ({ request }) => {
	try {
		// Check if user is admin (optional)
		const session = await auth.api.getSession({ headers: request.headers });
		
		authErrorLogger.clear();
		
		return json({
			status: 'ok',
			message: 'Error log cleared',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		return json({
			status: 'error',
			error: error?.message || 'Unknown error'
		}, { status: 500 });
	}
};
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Only allow authenticated users to access the seal image
	// You can add more restrictions here if needed
	if (!locals.user) {
		throw error(403, 'Unauthorized');
	}

	// Check if this is being requested from the contract page
	const referer = url.searchParams.get('context');
	if (referer !== 'contract') {
		throw error(403, 'Invalid context');
	}

	// Redirect to the static seal image
	// This will work on both local and Vercel environments
	throw redirect(303, '/seal.png');
};
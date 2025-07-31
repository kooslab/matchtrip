import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders, parent, url }) => {
	console.log('[PAGE SERVER] Starting page load');
	console.log('[PAGE SERVER] URL:', url.toString());

	// Get parent data (user, session, etc.)
	console.log('[PAGE SERVER] Getting parent data');
	const parentData = await parent();
	console.log(
		'[PAGE SERVER] Parent data received:',
		JSON.stringify(
			{
				hasUser: !!parentData.user,
				hasSession: !!parentData.session,
				userRole: parentData.userRole
			},
			null,
			2
		)
	);

	// Set conditional cache headers based on authentication status
	if (parentData.user) {
		// For authenticated users, disable caching of user-specific data
		// but allow browser to cache static assets
		setHeaders({
			'cache-control': 'private, no-cache, no-store, must-revalidate',
			pragma: 'no-cache',
			expires: '0'
		});
	} else {
		// For non-authenticated users, allow short-term caching
		// This improves performance for public pages
		setHeaders({
			'cache-control': 'public, max-age=60, s-maxage=60',
			vary: 'Cookie'
		});
	}

	// Return only authentication-related data
	// Destinations will be loaded client-side
	const returnData = {
		...parentData
	};

	console.log('[PAGE SERVER] Returning auth data');
	return returnData;
};

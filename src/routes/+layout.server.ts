import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

// Helper function to filter sensitive headers
function getFilteredHeaders(headers: Headers): Record<string, string> {
	const allowedHeaders = [
		'accept',
		'accept-language',
		'host',
		'referer',
		'user-agent',
		'sec-fetch-dest',
		'sec-fetch-mode',
		'sec-fetch-site'
	];
	
	const filtered: Record<string, string> = {};
	
	for (const [key, value] of headers.entries()) {
		if (allowedHeaders.includes(key.toLowerCase())) {
			// Truncate very long values
			filtered[key] = value.length > 100 ? value.substring(0, 100) + '...' : value;
		}
	}
	
	// Add a count of hidden headers for debugging
	const totalHeaders = Array.from(headers.entries()).length;
	const hiddenCount = totalHeaders - Object.keys(filtered).length;
	if (hiddenCount > 0) {
		filtered['[hidden-headers-count]'] = `${hiddenCount} headers hidden (including cookies)`;
	}
	
	return filtered;
}

export const load = async ({ request, locals }) => {
	console.log('[LAYOUT SERVER] Starting load function');
	console.log('[LAYOUT SERVER] Request URL:', request.url);
	console.log('[LAYOUT SERVER] Request headers:', getFilteredHeaders(request.headers));

	try {
		console.log('[LAYOUT SERVER] Getting session from auth.api');
		const session = await auth.api.getSession({
			headers: request.headers
		});

		console.log(
			'[LAYOUT SERVER] Session result:',
			JSON.stringify(
				{
					exists: !!session,
					userId: session?.user?.id,
					userEmail: session?.user?.email,
					sessionId: session?.session?.id
				},
				null,
				2
			)
		);

		let userRole = null;
		let fullUser = null;

		// If user is logged in, fetch their role and cache it
		if (session?.user?.id) {
			try {
				console.log('Layout server - Querying database for user:', session.user.id);
				const user = await db.query.users.findFirst({
					where: eq(users.id, session.user.id),
					columns: {
						id: true,
						role: true,
						name: true,
						email: true,
						emailVerified: true
					},
					with: {
						guideProfile: true
					}
				});

				console.log('Layout server - Database query result:', user);

				if (user) {
					userRole = user.role;
					fullUser = user;
					// Cache user data in locals for other server functions to use
					locals.user = {
						id: user.id,
						role: user.role,
						name: user.name,
						email: user.email,
						emailVerified: user.emailVerified,
						guideProfile: user.guideProfile
					};
					locals.session = session;
					console.log('Layout server - User cached in locals:', user.email, 'Role:', user.role);
				} else {
					console.log('Layout server - No user found in database for ID:', session.user.id);
				}
			} catch (error) {
				console.error('Layout server - Failed to fetch user role:', error);
				console.error(
					'Layout server - Error details:',
					error instanceof Error ? error.message : String(error)
				);
			}
		} else {
			console.log('Layout server - No session found');
		}

		const returnData = {
			user: session?.user ?? null,
			session: session?.session ?? null,
			userRole,
			fullUser
		};

		console.log(
			'[LAYOUT SERVER] Returning data:',
			JSON.stringify(
				{
					hasUser: !!returnData.user,
					hasSession: !!returnData.session,
					userRole: returnData.userRole,
					hasFullUser: !!returnData.fullUser
				},
				null,
				2
			)
		);

		return returnData;
	} catch (error) {
		console.error('[LAYOUT SERVER] Critical error:', error);
		console.error(
			'[LAYOUT SERVER] Error stack:',
			error instanceof Error ? error.stack : 'No stack trace'
		);

		// Return safe defaults on error
		return {
			user: null,
			session: null,
			userRole: null,
			fullUser: null
		};
	}
};

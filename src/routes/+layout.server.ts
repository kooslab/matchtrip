import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users, userAgreements } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { decryptUserFields } from '$lib/server/encryption';
import { redirect } from '@sveltejs/kit';

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
		let hasAgreedToTerms = false;

		// If user is logged in, fetch their role and cache it
		if (session?.user?.id) {
			try {
				console.log('Layout server - Querying database for user:', session.user.id);
				const user = await db.query.users.findFirst({
					where: and(
						eq(users.id, session.user.id),
						eq(users.isDeleted, false)
					),
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
					// Decrypt user fields before using them
					const decryptedUser = decryptUserFields(user);

					userRole = decryptedUser.role;
					fullUser = decryptedUser;

					// Check if user has agreed to terms
					const agreement = await db.query.userAgreements.findFirst({
						where: eq(userAgreements.userId, decryptedUser.id),
						columns: {
							termsAgreed: true,
							privacyAgreed: true
						}
					});

					hasAgreedToTerms = !!(agreement?.termsAgreed && agreement?.privacyAgreed);

					// Cache decrypted user data in locals for other server functions to use
					locals.user = {
						id: decryptedUser.id,
						role: decryptedUser.role,
						name: decryptedUser.name,
						email: decryptedUser.email,
						emailVerified: decryptedUser.emailVerified,
						guideProfile: decryptedUser.guideProfile
					};
					locals.session = session;
					locals.hasAgreedToTerms = hasAgreedToTerms;
					console.log(
						'Layout server - User cached in locals:',
						decryptedUser.email,
						'Role:',
						decryptedUser.role,
						'Has agreed:',
						hasAgreedToTerms
					);
				} else {
					// User has a session but doesn't exist in database or is deleted
					// This means they've been deleted - force logout
					console.log('Layout server - User deleted or not found, forcing logout');
					
					// Clear the session by redirecting to logout
					throw redirect(302, '/api/auth/sign-out?redirectTo=/');
				}
			} catch (error) {
				// If it's a redirect, re-throw it
				if (error instanceof Error && error.message.includes('redirect')) {
					throw error;
				}
				
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
			user: fullUser ?? null, // Return decrypted user data instead of session user
			session: session?.session ?? null,
			userRole,
			fullUser,
			hasAgreedToTerms
		};

		console.log(
			'[LAYOUT SERVER] Returning data:',
			JSON.stringify(
				{
					hasUser: !!returnData.user,
					hasSession: !!returnData.session,
					userRole: returnData.userRole,
					hasFullUser: !!returnData.fullUser,
					hasAgreedToTerms: returnData.hasAgreedToTerms
				},
				null,
				2
			)
		);

		return returnData;
	} catch (error) {
		// If it's a redirect, re-throw it
		if (error instanceof Error && error.message.includes('redirect')) {
			throw error;
		}
		
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
			fullUser: null,
			hasAgreedToTerms: false
		};
	}
};;

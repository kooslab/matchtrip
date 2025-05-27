export const load = async ({ locals }) => {
	// Session is guaranteed to exist here due to auth guard in hooks.server.ts
	const session = locals.session;

	console.log('My-trips page - Session from locals:', !!session);

	// You can now use the session for any data fetching if needed
	// For example: fetch user's trips using session.user.id

	return {
		session
	};
};

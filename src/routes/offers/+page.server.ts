export const load = async ({ locals }) => {
	// Session and user are guaranteed to exist and be valid due to auth guard in hooks.server.ts
	const session = locals.session;
	const user = locals.user;

	console.log('Offers page - Session from locals:', !!session, 'User from locals:', !!user);
	console.log('Offers page - User role:', user?.role);
	console.log('Offers page - Access granted for guide:', user?.email);

	return {
		session,
		user
	};
};

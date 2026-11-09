// Service is paused: the production database has been shut down, so no user
// session is ever loaded. The previous session-loading logic is preserved in git history.
export const load = async () => {
	return {
		user: null,
		session: null,
		userRole: null,
		fullUser: null,
		hasAgreedToTerms: false
	};
};

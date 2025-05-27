// Simple in-memory cache for user data
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 1 * 60 * 1000; // 1 minute

export function getCachedUser(userId: string) {
	const cached = userCache.get(userId);
	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.user;
	}
	return null;
}

export function setCachedUser(userId: string, user: any) {
	userCache.set(userId, {
		user,
		timestamp: Date.now()
	});
}

export function clearUserCache(userId?: string) {
	if (userId) {
		userCache.delete(userId);
	} else {
		userCache.clear();
	}
}

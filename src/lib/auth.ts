import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'pg' }),
	advanced: {
		generateId: false
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 8,
		maxPasswordLength: 20,
		passwordRegex: /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/,
		passwordRegexError: '비밀번호는 8~20자, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다.'
	},
	rateLimit: {
		storage: 'memory'
	},
	user: { modelName: 'users' },
	session: { modelName: 'sessions' },
	account: { modelName: 'accounts' },
	verification: { modelName: 'verifications' },
	trustedOrigins: [
		'https://matchtrip-johnny-ilmo-koos-projects.vercel.app',
		// Add any other domains you might deploy to
		'http://localhost:5173' // For local development
	]
});

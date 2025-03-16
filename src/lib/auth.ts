import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'pg' }),
	advanced: {
		generateId: false
	},
	emailAndPassword: { enabled: true, autoSignIn: true },
	rateLimit: { storage: 'database' },
	user: { modelName: 'users' },
	session: { modelName: 'sessions' },
	account: { modelName: 'accounts' },
	verification: { modelName: 'verifications' }
});

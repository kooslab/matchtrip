import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';
import { hashEmail } from './emailHash';

/**
 * Custom auth adapter that handles email hashing
 * We'll use drizzleAdapter as-is and handle email hashing in the auth configuration
 */
export function createHashedEmailAdapter() {
	return drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			users: schema.users,
			sessions: schema.sessions,
			accounts: schema.accounts,
			verifications: schema.verifications
		}
	});
}
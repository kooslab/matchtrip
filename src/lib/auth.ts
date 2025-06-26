import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';
import { sendVerificationEmail, sendPasswordResetEmail } from './server/email';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_BETTER_AUTH_URL } from '$env/static/public';

const getAuthUrl = () => {
	const url = PUBLIC_BETTER_AUTH_URL || 'http://localhost:5173';
	console.log('[AUTH CONFIG] Auth URL:', url);
	console.log('[AUTH CONFIG] PUBLIC_BETTER_AUTH_URL:', PUBLIC_BETTER_AUTH_URL);
	return url;
};

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'pg' }),
	advanced: {
		generateId: false
	},
	socialProviders: {
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			redirectURI: `${getAuthUrl()}/api/auth/callback/google`,
			prompt: "select_account" // Force account selection on each login
		}
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: false, // Disable auto sign-in to require email verification
		requireEmailVerification: true,
		minPasswordLength: 8,
		maxPasswordLength: 20,
		passwordRegex: /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/,
		passwordRegexError: '비밀번호는 8~20자, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다.',
		sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
			console.log('Sending password reset email to:', user.email);
			console.log('Reset URL:', url);
			await sendPasswordResetEmail(user.email, url);
		}
	},
	emailVerification: {
		enabled: true,
		sendOnSignUp: true, // Automatically send verification email on sign up
		autoSignInAfterVerification: true, // Auto sign in after email verification
		sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
			// Better-auth provides the complete verification URL and token
			console.log('Sending verification email to:', user.email);
			console.log('Verification URL:', url);
			await sendVerificationEmail(user.email, url);
		},
		// Redirect after verification
		callbackURL: '/signin?verified=true'
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
		'https://matchtrip.vercel.app',
		// Add any other domains you might deploy to
		'http://localhost:5173', // For local development,
		'https://matchtrip.net', // production
		'https://www.matchtrip.net' // production
	]
});

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './server/db';
import { sendVerificationEmail, sendPasswordResetEmail } from './server/email';

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'pg' }),
	advanced: {
		generateId: false
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: false, // Disable auto sign-in to require email verification
		requireEmailVerification: true,
		minPasswordLength: 8,
		maxPasswordLength: 20,
		passwordRegex: /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,20}$/,
		passwordRegexError: '비밀번호는 8~20자, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다.',
		sendResetPassword: async ({ user, url, token }: { user: any; url: string; token: string }) => {
			console.log('Sending password reset email to:', user.email);
			console.log('Reset URL:', url);
			await sendPasswordResetEmail(user.email, url);
		}
	},
	emailVerification: {
		enabled: true,
		sendOnSignUp: true, // Automatically send verification email on sign up
		autoSignInAfterVerification: true, // Auto sign in after email verification
		sendVerificationEmail: async ({ user, url, token }: { user: any; url: string; token: string }) => {
			// Better-auth provides the complete verification URL and token
			console.log('Sending verification email to:', user.email);
			console.log('Verification URL:', url);
			console.log('Verification token:', token);
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

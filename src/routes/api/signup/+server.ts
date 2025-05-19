import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, userAgreements, accounts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';
import crypto from 'crypto';

// Helper function to hash password
function hashPassword(password: string): string {
	const salt = crypto.randomBytes(16).toString('hex');
	const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
	return `${salt}:${hash}`;
}

export async function POST({ request }) {
	const {
		email,
		password,
		name,
		role,
		termsAgreed = false,
		privacyAgreed = false,
		marketingAgreed = false
	} = await request.json();

	// Log the password length and first character for debugging
	console.log('password', password);
	console.log('Password length:', password?.length);
	console.log('Password has number:', /\d/.test(password));
	console.log('Password has special char:', /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]+/.test(password));

	// Validate required agreements
	if (!termsAgreed || !privacyAgreed) {
		return json(
			{
				success: false,
				error: '이용약관과 개인정보 처리방침에 동의해 주세요.'
			},
			{ status: 400 }
		);
	}

	try {
		// First check if user already exists
		const existingUser = await db.select().from(users).where(eq(users.email, email));

		if (existingUser.length > 0) {
			return json(
				{
					success: false,
					error: '이미 등록된 이메일입니다.'
				},
				{ status: 400 }
			);
		}

		// Create a new user directly
		const now = new Date();
		const passwordHash = hashPassword(password);

		// Insert the user
		const [createdUser] = await db
			.insert(users)
			.values({
				email,
				name,
				emailVerified: false,
				role,
				createdAt: now,
				updatedAt: now
			})
			.returning();

		// Create the account record with password
		await db.insert(accounts).values({
			userId: createdUser.id,
			providerId: 'email',
			accountId: email,
			password: passwordHash,
			createdAt: now,
			updatedAt: now
		});

		// Create user agreements record
		await db.insert(userAgreements).values({
			userId: createdUser.id,
			termsAgreed,
			privacyAgreed,
			marketingAgreed,
			termsAgreedAt: termsAgreed ? now : null,
			privacyAgreedAt: privacyAgreed ? now : null,
			marketingAgreedAt: marketingAgreed ? now : null,
			updatedAt: now
		});

		return json({ success: true, user: createdUser });
	} catch (e) {
		console.error('Signup exception:', e);
		const message = e instanceof Error ? e.message : 'Unknown error';
		return json({ success: false, error: message }, { status: 500 });
	}
}

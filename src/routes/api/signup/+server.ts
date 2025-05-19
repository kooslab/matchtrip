import { json } from '@sveltejs/kit';
import { signUp } from '$lib/authClient'; // Or import your actual user creation logic
import { db } from '$lib/server/db';
import { users, userAgreements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

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

	// TODO: Replace with your actual user creation logic
	// This is a placeholder. You may need to use your DB or better-auth server logic.
	try {
		const result = await signUp.email({ email, password, name });
		// After user is created, update the role in your DB if needed
		// await db.users.update({ email }, { role });

		if (result.error) {
			console.log('Signup error:', result.error);
			return json({ success: false, error: result.error.message }, { status: 400 });
		}

		// Update the user's role after signup
		await db.update(users).set({ role }).where(eq(users.email, email));

		// Get the created user to get the ID
		const [createdUser] = await db.select().from(users).where(eq(users.email, email));

		// Create user agreements record
		const now = new Date();
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

		// Optionally, fetch the updated user
		const [updatedUser] = await db.select().from(users).where(eq(users.email, email));

		return json({ success: true, user: updatedUser });
	} catch (e) {
		console.error('Signup exception:', e);
		const message = e instanceof Error ? e.message : 'Unknown error';
		return json({ success: false, error: message }, { status: 500 });
	}
}

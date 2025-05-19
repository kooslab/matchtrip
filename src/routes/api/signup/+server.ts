import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, userAgreements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/auth';

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
		// Use auth.api directly with the correct method name
		const result = await auth.api.signUpEmail({
			body: {
				email,
				password,
				name
			}
		});

		// If we get here, signup was successful and we have a user
		if (result && result.user && result.user.id) {
			// Update the user's role after signup
			await db.update(users).set({ role }).where(eq(users.id, result.user.id));

			// Create user agreements record
			const now = new Date();
			await db.insert(userAgreements).values({
				userId: result.user.id,
				termsAgreed,
				privacyAgreed,
				marketingAgreed,
				termsAgreedAt: termsAgreed ? now : null,
				privacyAgreedAt: privacyAgreed ? now : null,
				marketingAgreedAt: marketingAgreed ? now : null,
				updatedAt: now
			});

			// Optionally, fetch the updated user
			const [updatedUser] = await db.select().from(users).where(eq(users.id, result.user.id));

			return json({ success: true, user: updatedUser });
		}

		return json({ success: true, user: result.user });
	} catch (e) {
		console.error('Signup exception:', e);
		const message = e instanceof Error ? e.message : 'Unknown error';
		return json({ success: false, error: message }, { status: 500 });
	}
}

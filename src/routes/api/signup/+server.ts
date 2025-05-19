import { json } from '@sveltejs/kit';
import { signUp } from '$lib/authClient'; // Or import your actual user creation logic
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ request }) {
	const { email, password, name, role } = await request.json();

	// TODO: Replace with your actual user creation logic
	// This is a placeholder. You may need to use your DB or better-auth server logic.
	try {
		const result = await signUp.email({ email, password, name });
		// After user is created, update the role in your DB if needed
		// await db.users.update({ email }, { role });

		if (result.error) {
			return json({ success: false, error: result.error.message }, { status: 400 });
		}

		// Update the user's role after signup
		await db.update(users).set({ role }).where(eq(users.email, email));

		// Optionally, fetch the updated user
		const [updatedUser] = await db.select().from(users).where(eq(users.email, email));

		return json({ success: true, user: updatedUser });
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Unknown error';
		return json({ success: false, error: message }, { status: 500 });
	}
}

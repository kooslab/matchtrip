import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { email } = await request.json();

		// Validate email
		if (!email || !email.includes('@')) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		// TEMPORARY: For now, just return success
		// In production, this would:
		// 1. Generate a verification token
		// 2. Save it to the database
		// 3. Send an email with verification link
		// 4. Update user's email if different from current

		console.log('Would send verification email to:', email);

		return json({ success: true, message: 'Verification email sent' });
	} catch (error) {
		console.error('Error sending verification email:', error);
		return json({ error: 'Failed to send verification email' }, { status: 500 });
	}
};

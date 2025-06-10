import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load({ url, request, locals }) {
	const token = url.searchParams.get('token');
	const verified = url.searchParams.get('verified');
	
	// If we're coming back from a successful verification
	if (verified === 'true' || (!token && locals.session?.user)) {
		// Check if the current user is verified
		if (locals.session?.user?.id) {
			const [user] = await db
				.select({ emailVerified: users.emailVerified })
				.from(users)
				.where(eq(users.id, locals.session.user.id));
				
			if (user?.emailVerified) {
				// User is verified, redirect to appropriate page
				throw redirect(302, locals.user?.role === 'guide' ? '/trips' : '/my-trips');
			}
		}
		
		return {
			verificationStatus: 'success',
			message: '이메일 인증이 완료되었습니다!'
		};
	}
	
	if (!token) {
		// No token provided, show the resend form
		return {
			verificationStatus: 'no_token'
		};
	}
	
	// If there's a token, let the client handle it
	return {
		verificationStatus: 'pending',
		token
	};
}
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { userAgreements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is logged in
	if (!locals.user) {
		redirect(302, '/signin');
	}

	// Check if user already has agreements
	const existingAgreement = await db.query.userAgreements.findFirst({
		where: eq(userAgreements.userId, locals.user.id)
	});

	// If user already agreed to terms, redirect them to appropriate page
	if (existingAgreement?.termsAgreed && existingAgreement?.privacyAgreed) {
		if (!locals.user.role) {
			redirect(302, '/select-role');
		} else if (locals.user.role === 'guide') {
			redirect(302, '/my-offers');
		} else {
			redirect(302, '/my-trips');
		}
	}

	return {
		user: locals.user
	};
};

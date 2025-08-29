import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { userAgreements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		console.error('[API/agreements] No user in locals - authentication failed');
		return json({ error: 'Unauthorized - No user session found' }, { status: 401 });
	}

	console.log('[API/agreements] Processing agreement for user:', locals.user.id);

	try {
		const { termsAgreed, privacyAgreed, marketingAgreed } = await request.json();

		// Validate required agreements
		if (!termsAgreed || !privacyAgreed) {
			return json({ error: 'Terms and privacy agreements are required' }, { status: 400 });
		}

		const now = new Date();

		// Check if user already has agreements
		const existingAgreement = await db.query.userAgreements.findFirst({
			where: eq(userAgreements.userId, locals.user.id)
		});

		if (existingAgreement) {
			// Update existing agreement
			await db
				.update(userAgreements)
				.set({
					termsAgreed,
					privacyAgreed,
					marketingAgreed,
					termsAgreedAt: termsAgreed ? now : existingAgreement.termsAgreedAt,
					privacyAgreedAt: privacyAgreed ? now : existingAgreement.privacyAgreedAt,
					marketingAgreedAt: marketingAgreed ? now : null,
					updatedAt: now
				})
				.where(eq(userAgreements.userId, locals.user.id));
		} else {
			// Create new agreement
			await db.insert(userAgreements).values({
				userId: locals.user.id,
				termsAgreed,
				privacyAgreed,
				marketingAgreed,
				termsAgreedAt: termsAgreed ? now : null,
				privacyAgreedAt: privacyAgreed ? now : null,
				marketingAgreedAt: marketingAgreed ? now : null
			});
		}

		console.log('[API/agreements] Successfully saved agreements for user:', locals.user.id);
		return json({ success: true });
	} catch (error) {
		console.error('[API/agreements] Error saving user agreements:', {
			userId: locals.user.id,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});

		// Provide more detailed error message
		const errorMessage = error instanceof Error ? error.message : 'Database error';
		return json(
			{
				error: `Failed to save agreements: ${errorMessage}`,
				details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
			},
			{ status: 500 }
		);
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const agreement = await db.query.userAgreements.findFirst({
			where: eq(userAgreements.userId, locals.user.id)
		});

		return json({ agreement });
	} catch (error) {
		console.error('Error fetching user agreements:', error);
		return json({ error: 'Failed to fetch agreements' }, { status: 500 });
	}
};

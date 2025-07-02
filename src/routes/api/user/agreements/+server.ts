import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { userAgreements } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

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

		return json({ success: true });
	} catch (error) {
		console.error('Error saving user agreements:', error);
		return json({ error: 'Failed to save agreements' }, { status: 500 });
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
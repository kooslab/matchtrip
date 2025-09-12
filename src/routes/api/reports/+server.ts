import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { reports } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		const session = locals.session;
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const reporterId = session.user.id;
		const body = await request.json();

		const {
			reportedUserId,
			conversationId,
			productConversationId,
			productId,
			offerId,
			reportType,
			description
		} = body;

		// Validate required fields
		if (!reportedUserId || !reportType) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Prevent self-reporting
		if (reporterId === reportedUserId) {
			return json({ error: 'Cannot report yourself' }, { status: 400 });
		}

		// Create the report
		const [report] = await db
			.insert(reports)
			.values({
				reporterId,
				reportedUserId,
				conversationId,
				productConversationId,
				productId,
				offerId,
				reportType,
				description,
				status: 'pending'
			})
			.returning();

		return json({ success: true, report }, { status: 201 });
	} catch (error) {
		console.error('Failed to create report:', error);
		return json({ error: 'Failed to create report' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check authentication
		const session = locals.session;
		if (!session?.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Get user's reports
		const userReports = await db
			.select()
			.from(reports)
			.where(eq(reports.reporterId, session.user.id))
			.orderBy(desc(reports.createdAt));

		return json({ reports: userReports });
	} catch (error) {
		console.error('Failed to fetch reports:', error);
		return json({ error: 'Failed to fetch reports' }, { status: 500 });
	}
};
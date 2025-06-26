import { json } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ request }) {
	console.log('[API USER ROLE] Request received');
	console.log('[API USER ROLE] Headers:', Object.fromEntries(request.headers.entries()));
	
	try {
		console.log('[API USER ROLE] Getting session');
		const session = await auth.api.getSession({ headers: request.headers });
		console.log('[API USER ROLE] Session:', JSON.stringify({
			exists: !!session,
			userId: session?.user?.id,
			userEmail: session?.user?.email
		}, null, 2));

		if (!session?.user?.id) {
			console.log('[API USER ROLE] No authenticated user');
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		console.log('[API USER ROLE] Querying user role for ID:', session.user.id);
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: {
				role: true
			}
		});
		console.log('[API USER ROLE] User query result:', user);

		if (!user) {
			console.log('[API USER ROLE] User not found in database');
			return json({ error: 'User not found' }, { status: 404 });
		}

		console.log('[API USER ROLE] Returning role:', user.role);
		return json({ role: user.role });
	} catch (error) {
		console.error('[API USER ROLE] Error:', error);
		console.error('[API USER ROLE] Error stack:', error instanceof Error ? error.stack : 'No stack');
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

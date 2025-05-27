import { json } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ request }) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session?.user?.id) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id),
			columns: {
				role: true
			}
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ role: user.role });
	} catch (error) {
		console.error('Error fetching user role:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

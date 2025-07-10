import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load = (async ({ params }) => {
	// Redirect to the first step of the edit flow
	throw redirect(302, `/my-trips/${params.id}/edit/destination`);
}) satisfies PageServerLoad;

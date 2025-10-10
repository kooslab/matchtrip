import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Redirect /settlement to /order-history
// This route exists for backward compatibility with Kakao AlimTalk templates
export const load: PageServerLoad = async () => {
	throw redirect(302, '/order-history');
};

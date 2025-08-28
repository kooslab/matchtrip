import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({ 
		status: 'ok',
		timestamp: new Date().toISOString()
	});
};

export const HEAD: RequestHandler = async () => {
	return new Response(null, { status: 200 });
};
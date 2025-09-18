import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';

export const GET: RequestHandler = async ({ url, locals }) => {
	// Only allow authenticated users to access the seal image
	// You can add more restrictions here if needed
	if (!locals.user) {
		throw error(403, 'Unauthorized');
	}
	
	// Check if this is being requested from the contract page
	const referer = url.searchParams.get('context');
	if (referer !== 'contract') {
		throw error(403, 'Invalid context');
	}
	
	try {
		// Path to the seal image - store it in a private location
		const sealPath = path.join(process.cwd(), 'src/lib/server/assets/seal.png');
		
		// Check if file exists
		if (!fs.existsSync(sealPath)) {
			throw error(404, 'Seal image not found');
		}
		
		// Read the file
		const sealImage = fs.readFileSync(sealPath);
		
		return new Response(sealImage, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'no-store, no-cache, must-revalidate',
				'Pragma': 'no-cache',
				'Expires': '0',
				// Prevent right-click save in some browsers
				'Content-Disposition': 'inline',
				// Add CSP to prevent easy downloading
				'Content-Security-Policy': "default-src 'self'"
			}
		});
	} catch (err) {
		console.error('Error serving seal image:', err);
		throw error(500, 'Failed to load seal image');
	}
};
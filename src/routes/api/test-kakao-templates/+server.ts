import { json } from '@sveltejs/kit';
import templates from '$lib/server/kakao/templates.json';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Return template data for the current environment (dev)
		// Only return necessary information, not sensitive data
		const availableTemplates = Object.entries(templates.dev).map(([code, template]) => ({
			code,
			name: template.name,
			description: template.description,
			text: template.text,
			variables: template.variables,
			button: template.button
		}));

		return json({
			success: true,
			templates: availableTemplates
		});
	} catch (error) {
		console.error('Error fetching templates:', error);
		return json(
			{
				success: false,
				error: 'Failed to fetch templates'
			},
			{ status: 500 }
		);
	}
};
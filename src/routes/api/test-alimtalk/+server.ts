import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { notificationService } from '$lib/server/services/notificationService';

export const GET: RequestHandler = async ({ url }) => {
	// Get test parameters from query string
	const phone = url.searchParams.get('phone');
	const template = url.searchParams.get('template') || 'signup01';
	const name = url.searchParams.get('name') || 'Test User';
	
	if (!phone) {
		return json({
			error: 'Phone number is required',
			usage: '/api/test-alimtalk?phone=821012345678&template=signup01&name=TestUser'
		}, { status: 400 });
	}
	
	try {
		console.log('=== TEST ALIMTALK START ===');
		console.log('Phone:', phone);
		console.log('Template:', template);
		console.log('Name:', name);
		
		const result = await notificationService.sendNotification({
			phoneNumber: phone,
			templateName: template,
			templateData: {
				SHOPNAME: '매치트립',
				NAME: name,
				// Add other template variables as needed based on template
				가이드: 'Test Guide',
				나의여행: 'My Trip',
				고객: 'Test Customer',
				여행총결제금액: '100,000원',
				메세지확인하기: 'Check Message',
				나의제안: 'My Offer',
				주문내역: 'Order History',
				가이드님: 'Guide'
			},
			skipDuplicateCheck: true // Allow testing multiple times
		});
		
		console.log('Result:', result);
		console.log('=== TEST ALIMTALK END ===');
		
		return json({
			success: result.success,
			messageId: result.messageId,
			error: result.error,
			template: template,
			phone: phone
		});
	} catch (error) {
		console.error('Test AlimTalk error:', error);
		return json({
			error: error instanceof Error ? error.message : 'Unknown error',
			template: template,
			phone: phone
		}, { status: 500 });
	}
};
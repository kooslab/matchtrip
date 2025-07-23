import { env } from '$env/dynamic/private';

interface DeliveryReport {
	bulkId: string;
	messageId: string;
	to: string;
	sentAt: string;
	doneAt: string;
	smsCount: number;
	mccMnc: string;
	price: {
		pricePerMessage: number;
		currency: string;
	};
	status: {
		groupId: number;
		groupName: string;
		id: number;
		name: string;
		description: string;
	};
	error: {
		groupId: number;
		groupName: string;
		id: number;
		name: string;
		description: string;
		permanent: boolean;
	};
}

export async function getDeliveryReports(messageId?: string) {
	if (!env.INFOBIP_API_KEY || !env.INFOBIP_BASE_URL) {
		throw new Error('INFOBIP_API_KEY and INFOBIP_BASE_URL are required in environment variables');
	}
	const apiKey = env.INFOBIP_API_KEY;
	const baseUrl = env.INFOBIP_BASE_URL;
	
	let url = `${baseUrl}/sms/1/reports`;
	if (messageId) {
		url += `?messageId=${messageId}`;
	}
	
	console.log('Fetching delivery reports from:', url);
	
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Authorization': `App ${apiKey}`,
			'Accept': 'application/json'
		}
	});
	
	const responseText = await response.text();
	console.log('Delivery reports response:', responseText);
	
	if (!response.ok) {
		throw new Error(`Failed to get delivery reports: ${response.status} - ${responseText}`);
	}
	
	return JSON.parse(responseText);
}

export async function getLogsForMessage(messageId: string) {
	if (!env.INFOBIP_API_KEY || !env.INFOBIP_BASE_URL) {
		throw new Error('INFOBIP_API_KEY and INFOBIP_BASE_URL are required in environment variables');
	}
	const apiKey = env.INFOBIP_API_KEY;
	const baseUrl = env.INFOBIP_BASE_URL;
	
	const url = `${baseUrl}/sms/1/logs?messageId=${messageId}`;
	
	console.log('Fetching logs for message:', messageId);
	
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			'Authorization': `App ${apiKey}`,
			'Accept': 'application/json'
		}
	});
	
	const responseText = await response.text();
	console.log('Logs response:', responseText);
	
	if (!response.ok) {
		throw new Error(`Failed to get logs: ${response.status} - ${responseText}`);
	}
	
	return JSON.parse(responseText);
}
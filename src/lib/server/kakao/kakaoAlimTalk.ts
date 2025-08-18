import { env } from '$env/dynamic/private';

export interface KakaoButton {
	type: 'URL';
	name: string;
	urlMobile: string;
	urlPc: string;
}

interface KakaoAlimTalkMessage {
	to: string;
	templateCode: string;
	text: string;
	title?: string;
	templateData?: Record<string, string>;
	buttons?: KakaoButton[];
}

interface InfobipKakaoRequest {
	messages: Array<{
		sender: string;
		destinations: Array<{
			to: string;
		}>;
		content: {
			templateCode: string;
			text: string;
			title?: string;
			type: 'TEMPLATE';
			buttons?: KakaoButton[];
		};
	}>;
}

export class KakaoAlimTalkService {
	private apiKey: string;
	private baseUrl: string;
	private channelProfileKey: string;

	constructor() {
		this.apiKey = env.INFOBIP_API_KEY || '';
		this.baseUrl = env.INFOBIP_BASE_URL || '';
		this.channelProfileKey = env.KAKAO_CHANNEL_PROFILE_KEY || '';

		if (!this.apiKey || !this.baseUrl || !this.channelProfileKey) {
			console.warn(
				'Kakao AlimTalk service not configured. Missing required environment variables.'
			);
		}
	}

	async sendAlimTalk(message: KakaoAlimTalkMessage) {
		if (!this.apiKey || !this.baseUrl || !this.channelProfileKey) {
			throw new Error('Kakao AlimTalk service not configured');
		}

		const endpoint = `${this.baseUrl}/kakao-alim/1/messages`;

		// Replace template variables in text if templateData is provided
		let processedText = message.text;
		if (message.templateData) {
			for (const [key, value] of Object.entries(message.templateData)) {
				const placeholder = `#{${key}}`;
				processedText = processedText.replace(new RegExp(placeholder, 'g'), value);
			}
		}
		const requestBody: InfobipKakaoRequest = {
			messages: [
				{
					sender: this.channelProfileKey,
					destinations: [
						{
							to: message.to
						}
					],
					content: {
						templateCode: message.templateCode,
						text: processedText,
						...(message.title ? { title: message.title } : {}),
						type: 'TEMPLATE',
						...(message.buttons ? { buttons: message.buttons } : {})
					}
				}
			]
		};

		const headers = {
			Authorization: `App ${this.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};

		// Debug logging
		console.log('=== Kakao AlimTalk Request Debug ===');
		console.log('Endpoint:', endpoint);
		console.log(
			'Headers:',
			JSON.stringify(
				{
					...headers,
					Authorization: `App ${this.apiKey.substring(0, 10)}...` // Mask API key for security
				},
				null,
				2
			)
		);
		console.log('Request Body:', JSON.stringify(requestBody, null, 2));
		console.log('Channel Profile Key:', this.channelProfileKey);
		console.log('=====================================');

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify(requestBody)
			});

			const data = await response.json();

			console.log('=== Kakao AlimTalk Response ===');
			console.log('Status:', response.status, response.statusText);
			console.log('Response:', JSON.stringify(data, null, 2));
			console.log('================================');

			if (!response.ok) {
				console.error('Kakao AlimTalk API error:', data);
				throw new Error(
					data.requestError?.serviceException?.text || 'Failed to send Kakao AlimTalk'
				);
			}

			return data;
		} catch (error) {
			console.error('Kakao AlimTalk sending error:', error);
			throw error;
		}
	}

	async getLogs(params?: {
		messageId?: string;
		bulkId?: string;
		sentSince?: string;
		sentUntil?: string;
		limit?: number;
	}) {
		if (!this.apiKey || !this.baseUrl) {
			throw new Error('Kakao AlimTalk service not configured');
		}

		const queryParams = new URLSearchParams();
		if (params?.messageId) queryParams.append('messageId', params.messageId);
		if (params?.bulkId) queryParams.append('bulkId', params.bulkId);
		if (params?.sentSince) queryParams.append('sentSince', params.sentSince);
		if (params?.sentUntil) queryParams.append('sentUntil', params.sentUntil);
		if (params?.limit) queryParams.append('limit', params.limit.toString());

		const endpoint = `${this.baseUrl}/kakao-alim/1/logs${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

		const headers = {
			Authorization: `App ${this.apiKey}`,
			Accept: 'application/json'
		};

		console.log('=== Kakao AlimTalk Get Logs Debug ===');
		console.log('Endpoint:', endpoint);
		console.log(
			'Headers:',
			JSON.stringify(
				{
					...headers,
					Authorization: `App ${this.apiKey.substring(0, 10)}...`
				},
				null,
				2
			)
		);
		console.log('=====================================');

		try {
			const response = await fetch(endpoint, {
				method: 'GET',
				headers
			});

			const data = await response.json();

			console.log('=== Kakao AlimTalk Logs Response ===');
			console.log('Status:', response.status, response.statusText);
			console.log('Response:', JSON.stringify(data, null, 2));
			console.log('=====================================');

			if (!response.ok) {
				console.error('Kakao AlimTalk API error:', data);
				throw new Error(
					data.requestError?.serviceException?.text || 'Failed to get Kakao AlimTalk logs'
				);
			}

			return data;
		} catch (error) {
			console.error('Kakao AlimTalk logs error:', error);
			throw error;
		}
	}

	async getDeliveryReports(params?: {
		bulkId?: string;
		messageId?: string;
		limit?: number;
		entityId?: string;
		applicationId?: string;
		campaignReferenceId?: string;
	}) {
		if (!this.apiKey || !this.baseUrl) {
			throw new Error('Kakao AlimTalk service not configured');
		}

		const queryParams = new URLSearchParams();
		if (params?.bulkId) queryParams.append('bulkId', params.bulkId);
		if (params?.messageId) queryParams.append('messageId', params.messageId);
		if (params?.limit) queryParams.append('limit', params.limit.toString());
		if (params?.entityId) queryParams.append('entityId', params.entityId);
		if (params?.applicationId) queryParams.append('applicationId', params.applicationId);
		if (params?.campaignReferenceId)
			queryParams.append('campaignReferenceId', params.campaignReferenceId);

		const endpoint = `${this.baseUrl}/kakao-alim/1/reports${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

		const headers = {
			Authorization: `App ${this.apiKey}`,
			Accept: 'application/json'
		};

		console.log('=== Kakao AlimTalk Delivery Reports Debug ===');
		console.log('Endpoint:', endpoint);
		console.log(
			'Headers:',
			JSON.stringify(
				{
					...headers,
					Authorization: `App ${this.apiKey.substring(0, 10)}...`
				},
				null,
				2
			)
		);
		console.log('=============================================');

		try {
			const response = await fetch(endpoint, {
				method: 'GET',
				headers
			});

			const data = await response.json();

			console.log('=== Kakao AlimTalk Reports Response ===');
			console.log('Status:', response.status, response.statusText);
			console.log('Response:', JSON.stringify(data, null, 2));
			console.log('=======================================');

			if (!response.ok) {
				console.error('Kakao AlimTalk API error:', data);
				throw new Error(
					data.requestError?.serviceException?.text || 'Failed to get delivery reports'
				);
			}

			return data;
		} catch (error) {
			console.error('Kakao AlimTalk delivery reports error:', error);
			throw error;
		}
	}

	async sendBulkAlimTalk(messages: KakaoAlimTalkMessage[]) {
		if (!this.apiKey || !this.baseUrl || !this.channelProfileKey) {
			throw new Error('Kakao AlimTalk service not configured');
		}

		const endpoint = `${this.baseUrl}/kakao-alim/1/messages`;

		const requestBody: InfobipKakaoRequest = {
			messages: messages.map((message) => {
				// Replace template variables in text if templateData is provided
				let processedText = message.text;
				if (message.templateData) {
					for (const [key, value] of Object.entries(message.templateData)) {
						const placeholder = `#{${key}}`;
						processedText = processedText.replace(new RegExp(placeholder, 'g'), value);
					}
				}

				return {
					sender: this.channelProfileKey,
					destinations: [
						{
							to: message.to
						}
					],
					content: {
						templateCode: message.templateCode,
						text: processedText,
						...(message.title ? { title: message.title } : {}),
						type: 'TEMPLATE',
						...(message.buttons ? { buttons: message.buttons } : {})
					}
				};
			})
		};

		const headers = {
			Authorization: `App ${this.apiKey}`,
			'Content-Type': 'application/json',
			Accept: 'application/json'
		};

		// Debug logging
		console.log('=== Kakao AlimTalk Bulk Request Debug ===');
		console.log('Endpoint:', endpoint);
		console.log(
			'Headers:',
			JSON.stringify(
				{
					...headers,
					Authorization: `App ${this.apiKey.substring(0, 10)}...` // Mask API key for security
				},
				null,
				2
			)
		);
		console.log('Request Body:', JSON.stringify(requestBody, null, 2));
		console.log('Number of messages:', messages.length);
		console.log('Channel Profile Key:', this.channelProfileKey);
		console.log('=========================================');

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers,
				body: JSON.stringify(requestBody)
			});

			const data = await response.json();

			console.log('=== Kakao AlimTalk Response ===');
			console.log('Status:', response.status, response.statusText);
			console.log('Response:', JSON.stringify(data, null, 2));
			console.log('================================');

			if (!response.ok) {
				console.error('Kakao AlimTalk API error:', data);
				throw new Error(
					data.requestError?.serviceException?.text || 'Failed to send Kakao AlimTalk'
				);
			}

			return data;
		} catch (error) {
			console.error('Kakao AlimTalk sending error:', error);
			throw error;
		}
	}
}

export const kakaoAlimTalk = new KakaoAlimTalkService();

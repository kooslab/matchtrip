import { env } from '$env/dynamic/private';

interface KakaoAlimTalkMessage {
	to: string;
	sender: string;
	templateCode: string;
	text: string;
	templateData?: Record<string, string>;
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
			type: 'TEMPLATE';
		};
	}>;
}

export class KakaoAlimTalkService {
	private apiKey: string;
	private baseUrl: string;

	constructor() {
		this.apiKey = env.INFOBIP_API_KEY || '';
		this.baseUrl = env.INFOBIP_BASE_URL || '';

		if (!this.apiKey || !this.baseUrl) {
			console.warn('Kakao AlimTalk service not configured. Missing required environment variables.');
		}
	}

	async sendAlimTalk(message: KakaoAlimTalkMessage) {
		if (!this.apiKey || !this.baseUrl) {
			throw new Error('Kakao AlimTalk service not configured');
		}

		const endpoint = `${this.baseUrl}/kakao-alim/1/messages`;

		const requestBody: InfobipKakaoRequest = {
			messages: [
				{
					sender: message.sender,
					destinations: [
						{
							to: message.to
						}
					],
					content: {
						templateCode: message.templateCode,
						text: message.text,
						type: 'TEMPLATE'
					}
				}
			]
		};

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Authorization': `App ${this.apiKey}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const data = await response.json();

			if (!response.ok) {
				console.error('Kakao AlimTalk API error:', data);
				throw new Error(data.requestError?.serviceException?.text || 'Failed to send Kakao AlimTalk');
			}

			return data;
		} catch (error) {
			console.error('Kakao AlimTalk sending error:', error);
			throw error;
		}
	}

	async sendBulkAlimTalk(messages: KakaoAlimTalkMessage[]) {
		if (!this.apiKey || !this.baseUrl) {
			throw new Error('Kakao AlimTalk service not configured');
		}

		const endpoint = `${this.baseUrl}/kakao-alim/1/messages`;

		const requestBody: InfobipKakaoRequest = {
			messages: messages.map(message => ({
				sender: message.sender,
				destinations: [
					{
						to: message.to
					}
				],
				content: {
					templateCode: message.templateCode,
					text: message.text,
					type: 'TEMPLATE'
				}
			}))
		};

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Authorization': `App ${this.apiKey}`,
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const data = await response.json();

			if (!response.ok) {
				console.error('Kakao AlimTalk API error:', data);
				throw new Error(data.requestError?.serviceException?.text || 'Failed to send Kakao AlimTalk');
			}

			return data;
		} catch (error) {
			console.error('Kakao AlimTalk sending error:', error);
			throw error;
		}
	}
}

export const kakaoAlimTalk = new KakaoAlimTalkService();
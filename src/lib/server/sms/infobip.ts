import { env } from '$env/dynamic/private';

interface InfobipSMSConfig {
	apiKey: string;
	baseUrl: string;
	sender: string;
}

interface SendSMSParams {
	to: string;
	text: string;
	from?: string;
}

interface InfobipResponse {
	messages: Array<{
		to: string;
		status: {
			groupId: number;
			groupName: string;
			id: number;
			name: string;
			description: string;
		};
		messageId: string;
	}>;
}

class InfobipSMS {
	private config: InfobipSMSConfig;

	constructor(config: InfobipSMSConfig) {
		this.config = config;
	}

	async sendSMS({ to, text, from }: SendSMSParams): Promise<InfobipResponse> {
		const url = `${this.config.baseUrl}/sms/2/text/advanced`;

		const payload = {
			messages: [
				{
					destinations: [{ to }],
					from: from || this.config.sender,
					text
				}
			]
		};

		console.log('================== SMS SEND START ==================');
		console.log('[SMS] Sending to:', to);
		console.log('[SMS] Message length:', text.length, 'characters');
		console.log('[SMS] From:', from || this.config.sender || 'default');
		console.log('[SMS] API Endpoint:', url);
		console.log('[SMS] Request payload:', JSON.stringify(payload, null, 2));
		console.log('[SMS] API Key configured:', this.config.apiKey ? `Yes (length: ${this.config.apiKey.length})` : 'No');
		console.log('====================================================');

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					Authorization: `App ${this.config.apiKey}`,
					'Content-Type': 'application/json',
					Accept: 'application/json'
				},
				body: JSON.stringify(payload)
			});

			const responseText = await response.text();
			console.log('[SMS] Response status:', response.status, response.statusText);
			console.log('[SMS] Response headers:', Object.fromEntries(response.headers.entries()));
			console.log('[SMS] Response body:', responseText);

			if (!response.ok) {
				console.error('[SMS] ❌ API Error:', response.status, '-', responseText);
				console.log('================== SMS SEND FAILED ==================');
				throw new Error(`Infobip API error: ${response.status} - ${responseText}`);
			}

			const data = JSON.parse(responseText) as InfobipResponse;

			// Check message status
			if (data.messages && data.messages.length > 0) {
				const message = data.messages[0];
				console.log('[SMS] Message ID:', message.messageId);
				console.log('[SMS] Status:', `${message.status.groupName} (${message.status.name})`);
				console.log('[SMS] Status Description:', message.status.description);
				
				// Check if SMS was accepted (group 1 = Pending/Accepted, 3 = Delivered)
				if (message.status.groupId === 1 || message.status.groupId === 3) {
					console.log('[SMS] ✅ SMS successfully accepted for delivery');
					console.log('[SMS] To:', message.to);
					console.log('[SMS] Message ID:', message.messageId);
				} else {
					console.error('[SMS] ⚠️ SMS not accepted. Status group:', message.status.groupId);
				}
			} else {
				console.error('[SMS] ⚠️ No message response received');
			}

			console.log('================== SMS SEND END ==================');
			return data;
		} catch (error) {
			console.error('[SMS] ❌ Exception during SMS send:', error);
			console.log('================== SMS SEND FAILED ==================');
			throw error;
		}
	}

	async sendBulkSMS(
		messages: Array<{ to: string; text: string; from?: string }>
	): Promise<InfobipResponse> {
		const url = `${this.config.baseUrl}/sms/2/text/advanced`;

		const payload = {
			messages: messages.map((msg) => ({
				destinations: [{ to: msg.to }],
				from: msg.from || this.config.sender,
				text: msg.text
			}))
		};

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `App ${this.config.apiKey}`,
				'Content-Type': 'application/json',
				Accept: 'application/json'
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Infobip API error: ${response.status} - ${error}`);
		}

		const data = (await response.json()) as InfobipResponse;
		return data;
	}
}

// Create a function to get the SMS instance with SvelteKit env vars
function getInfobipSMS() {
	if (!env.INFOBIP_API_KEY) {
		throw new Error('INFOBIP_API_KEY is required in environment variables');
	}
	if (!env.INFOBIP_BASE_URL) {
		throw new Error('INFOBIP_BASE_URL is required in environment variables');
	}
	if (!env.INFOBIP_SENDER) {
		throw new Error('INFOBIP_SENDER is required in environment variables');
	}

	return new InfobipSMS({
		apiKey: env.INFOBIP_API_KEY,
		baseUrl: env.INFOBIP_BASE_URL,
		sender: env.INFOBIP_SENDER
	});
}

const infobipSMS = getInfobipSMS();

export { infobipSMS, type SendSMSParams, type InfobipResponse };

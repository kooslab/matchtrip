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

		console.log('Sending SMS request to:', url);
		console.log('Payload:', JSON.stringify(payload, null, 2));
		console.log(
			'Using API Key:',
			this.config.apiKey ? 'Yes (length: ' + this.config.apiKey.length + ')' : 'No'
		);

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
		console.log('Response status:', response.status);
		console.log('Response body:', responseText);

		if (!response.ok) {
			throw new Error(`Infobip API error: ${response.status} - ${responseText}`);
		}

		const data = JSON.parse(responseText) as InfobipResponse;

		// Check message status
		if (data.messages && data.messages.length > 0) {
			const message = data.messages[0];
			console.log('Message status:', message.status);
			console.log('Message ID:', message.messageId);
		}

		return data;
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

<script lang="ts">
	let phoneNumber = '';
	let sender = '';
	let templateCode = '1';
	let text = '[#{SHOPNAME}], 안녕하세요. #{NAME}님! #{SHOPNAME}에 회원가입 해주셔서 진심으로 감사드립니다!';
	let templateData = '{\n  "SHOPNAME": "매치트립",\n  "NAME": "홍길동"\n}';
	let loading = false;
	let result: any = null;
	let error: string | null = null;

	async function sendTestKakao() {
		loading = true;
		error = null;
		result = null;

		try {
			let parsedTemplateData;
			try {
				parsedTemplateData = templateData ? JSON.parse(templateData) : undefined;
			} catch (e) {
				error = 'Invalid JSON in template data';
				loading = false;
				return;
			}

			const response = await fetch('/api/test-kakao', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					to: phoneNumber,
					sender: sender,
					templateCode: templateCode,
					text: text,
					templateData: parsedTemplateData
				})
			});

			const data = await response.json();
			
			if (response.ok) {
				result = data;
			} else {
				error = data.error || 'Failed to send Kakao AlimTalk';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 p-4">
	<div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
		<h1 class="text-2xl font-bold mb-6">Kakao AlimTalk Test</h1>
		
		<div class="space-y-4">
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
					Phone Number
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phoneNumber}
					placeholder="821012345678"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary"
				/>
				<p class="text-xs text-gray-500 mt-1">Phone number in international format without + sign. For Korea: 82 + phone number without leading 0 (e.g., 821012345678)</p>
			</div>
			
			<div>
				<label for="sender" class="block text-sm font-medium text-gray-700 mb-1">
					Sender (KakaoTalk Official Account ID)
				</label>
				<input
					id="sender"
					type="text"
					bind:value={sender}
					placeholder="OFFICIAL-ACCOUNT-ID-123"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary"
				/>
				<p class="text-xs text-gray-500 mt-1">Your registered KakaoTalk official account ID</p>
			</div>
			
			<div>
				<label for="templateCode" class="block text-sm font-medium text-gray-700 mb-1">
					Template Code
				</label>
				<input
					id="templateCode"
					type="text"
					bind:value={templateCode}
					placeholder="123"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary"
				/>
				<p class="text-xs text-gray-500 mt-1">The code of your approved Kakao template</p>
			</div>
			
			<div>
				<label for="text" class="block text-sm font-medium text-gray-700 mb-1">
					Text Message
				</label>
				<textarea
					id="text"
					bind:value={text}
					rows="3"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary"
				></textarea>
				<p class="text-xs text-gray-500 mt-1">The actual message text to send</p>
			</div>
			
			<div>
				<label for="templateData" class="block text-sm font-medium text-gray-700 mb-1">
					Template Data (JSON) - Optional
				</label>
				<textarea
					id="templateData"
					bind:value={templateData}
					rows="4"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary font-mono text-sm"
				></textarea>
				<p class="text-xs text-gray-500 mt-1">Variables for template substitution in JSON format</p>
			</div>
			
			<button
				onclick={sendTestKakao}
				disabled={loading || !phoneNumber || !sender || !templateCode || !text}
				class="w-full py-2 px-4 bg-color-primary text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? 'Sending...' : 'Send Test AlimTalk'}
			</button>
		</div>
		
		{#if error}
			<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
				<p class="text-sm text-red-700">Error: {error}</p>
			</div>
		{/if}
		
		{#if result}
			<div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
				<p class="text-sm text-green-700 font-medium mb-2">AlimTalk sent successfully!</p>
				<pre class="text-xs overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
				
				{#if result.result?.messages?.[0]}
					<div class="mt-3 p-3 bg-white rounded border border-green-300">
						<p class="text-xs font-medium text-gray-700 mb-1">Message Details:</p>
						<p class="text-xs text-gray-600">Message ID: {result.result.messages[0].to}</p>
						<p class="text-xs text-gray-600">Status: {result.result.messages[0].status?.name || 'PENDING'}</p>
						{#if result.result.messages[0].status?.description}
							<p class="text-xs text-gray-600">Description: {result.result.messages[0].status.description}</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
	
	<div class="max-w-md mx-auto mt-6 p-4 bg-blue-50 rounded-lg">
		<h2 class="font-semibold text-blue-900 mb-2">Required Environment Variables:</h2>
		<ul class="text-sm text-blue-800 space-y-1">
			<li>• INFOBIP_API_KEY (required)</li>
			<li>• INFOBIP_BASE_URL (required)</li>
		</ul>
		<p class="text-xs text-blue-700 mt-3">
			Note: You need to register your KakaoTalk official account with Infobip and get templates approved before sending AlimTalk messages.
			The sender field should be your KakaoTalk official account ID.
		</p>
	</div>
	
	<div class="max-w-md mx-auto mt-4 p-4 bg-yellow-50 rounded-lg">
		<h2 class="font-semibold text-yellow-900 mb-2">Template Usage:</h2>
		<p class="text-sm text-yellow-800 mb-2">
			AlimTalk requires pre-approved templates. Each template has:
		</p>
		<ul class="text-sm text-yellow-800 space-y-1">
			<li>• Template ID: Unique identifier</li>
			<li>• Variables: Placeholders for dynamic content</li>
			<li>• Fixed format: Cannot be modified</li>
		</ul>
		<p class="text-xs text-yellow-700 mt-3">
			Example template data for welcome message (Template ID: 1):
		</p>
		<pre class="text-xs bg-yellow-100 p-2 rounded mt-1 overflow-x-auto">{`{
  "SHOPNAME": "매치트립",
  "NAME": "김철수"
}`}</pre>
		<p class="text-xs text-yellow-700 mt-2">
			This will generate: "[매치트립], 안녕하세요. 김철수님! 매치트립에 회원가입 해주셔서 진심으로 감사드립니다!"
		</p>
	</div>
</div>
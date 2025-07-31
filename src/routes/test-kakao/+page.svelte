<script lang="ts">
	let phoneNumber = '';
	let sender = '';
	let templateCode = '1';
	let text =
		'[#{SHOPNAME}], 안녕하세요. #{NAME}님! #{SHOPNAME}에 회원가입 해주셔서 진심으로 감사드립니다!';
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
	<div class="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
		<h1 class="mb-6 text-2xl font-bold">Kakao AlimTalk Test</h1>

		<div class="space-y-4">
			<div>
				<label for="phone" class="mb-1 block text-sm font-medium text-gray-700">
					Phone Number
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phoneNumber}
					placeholder="821012345678"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-gray-500">
					Phone number in international format without + sign. For Korea: 82 + phone number without
					leading 0 (e.g., 821012345678)
				</p>
			</div>

			<div>
				<label for="sender" class="mb-1 block text-sm font-medium text-gray-700">
					Sender (KakaoTalk Official Account ID)
				</label>
				<input
					id="sender"
					type="text"
					bind:value={sender}
					placeholder="OFFICIAL-ACCOUNT-ID-123"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-gray-500">Your registered KakaoTalk official account ID</p>
			</div>

			<div>
				<label for="templateCode" class="mb-1 block text-sm font-medium text-gray-700">
					Template Code
				</label>
				<input
					id="templateCode"
					type="text"
					bind:value={templateCode}
					placeholder="123"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-gray-500">The code of your approved Kakao template</p>
			</div>

			<div>
				<label for="text" class="mb-1 block text-sm font-medium text-gray-700">
					Text Message
				</label>
				<textarea
					id="text"
					bind:value={text}
					rows="3"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				></textarea>
				<p class="mt-1 text-xs text-gray-500">The actual message text to send</p>
			</div>

			<div>
				<label for="templateData" class="mb-1 block text-sm font-medium text-gray-700">
					Template Data (JSON) - Optional
				</label>
				<textarea
					id="templateData"
					bind:value={templateData}
					rows="4"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:ring-2 focus:outline-none"
				></textarea>
				<p class="mt-1 text-xs text-gray-500">Variables for template substitution in JSON format</p>
			</div>

			<button
				onclick={sendTestKakao}
				disabled={loading || !phoneNumber || !sender || !templateCode || !text}
				class="bg-color-primary w-full rounded-md px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
			>
				{loading ? 'Sending...' : 'Send Test AlimTalk'}
			</button>
		</div>

		{#if error}
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
				<p class="text-sm text-red-700">Error: {error}</p>
			</div>
		{/if}

		{#if result}
			<div class="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
				<p class="mb-2 text-sm font-medium text-green-700">AlimTalk sent successfully!</p>
				<pre class="overflow-x-auto text-xs">{JSON.stringify(result, null, 2)}</pre>

				{#if result.result?.messages?.[0]}
					<div class="mt-3 rounded border border-green-300 bg-white p-3">
						<p class="mb-1 text-xs font-medium text-gray-700">Message Details:</p>
						<p class="text-xs text-gray-600">Message ID: {result.result.messages[0].to}</p>
						<p class="text-xs text-gray-600">
							Status: {result.result.messages[0].status?.name || 'PENDING'}
						</p>
						{#if result.result.messages[0].status?.description}
							<p class="text-xs text-gray-600">
								Description: {result.result.messages[0].status.description}
							</p>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="mx-auto mt-6 max-w-md rounded-lg bg-blue-50 p-4">
		<h2 class="mb-2 font-semibold text-blue-900">Required Environment Variables:</h2>
		<ul class="space-y-1 text-sm text-blue-800">
			<li>• INFOBIP_API_KEY (required)</li>
			<li>• INFOBIP_BASE_URL (required)</li>
		</ul>
		<p class="mt-3 text-xs text-blue-700">
			Note: You need to register your KakaoTalk official account with Infobip and get templates
			approved before sending AlimTalk messages. The sender field should be your KakaoTalk official
			account ID.
		</p>
	</div>

	<div class="mx-auto mt-4 max-w-md rounded-lg bg-yellow-50 p-4">
		<h2 class="mb-2 font-semibold text-yellow-900">Template Usage:</h2>
		<p class="mb-2 text-sm text-yellow-800">
			AlimTalk requires pre-approved templates. Each template has:
		</p>
		<ul class="space-y-1 text-sm text-yellow-800">
			<li>• Template ID: Unique identifier</li>
			<li>• Variables: Placeholders for dynamic content</li>
			<li>• Fixed format: Cannot be modified</li>
		</ul>
		<p class="mt-3 text-xs text-yellow-700">
			Example template data for welcome message (Template ID: 1):
		</p>
		<pre class="mt-1 overflow-x-auto rounded bg-yellow-100 p-2 text-xs">{`{
  "SHOPNAME": "매치트립",
  "NAME": "김철수"
}`}</pre>
		<p class="mt-2 text-xs text-yellow-700">
			This will generate: "[매치트립], 안녕하세요. 김철수님! 매치트립에 회원가입 해주셔서 진심으로
			감사드립니다!"
		</p>
	</div>
</div>

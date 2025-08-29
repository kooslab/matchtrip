<script lang="ts">
	// Default to German number for testing foreign SMS
	let phoneNumber = '+491744360256';
	let message = 'Test message from MatchTrip';
	let loading = false;
	let result: any = null;
	let error: string | null = null;

	// Test mode: 'direct' or 'template'
	let testMode: 'direct' | 'template' = 'template';
	let selectedTemplate = 'signup01';
	
	// Template test data
	let templateData = {
		NAME: 'Test User',
		SHOPNAME: 'MatchTrip',
		TRIP_NAME: 'Test Trip',
		GUIDE_NAME: 'Test Guide'
	};

	async function sendTestSMS() {
		loading = true;
		error = null;
		result = null;

		try {
			let endpoint = '/api/test-sms';
			let body: any;
			
			if (testMode === 'direct') {
				endpoint += '?type=direct';
				body = {
					to: phoneNumber,
					text: message
				};
			} else {
				endpoint += '?type=notification';
				body = {
					phoneNumber,
					templateName: selectedTemplate,
					templateData
				};
			}
			
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			const data = await response.json();

			if (response.ok) {
				result = data;
			} else {
				error = data.error || 'Failed to send SMS';
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
		<h1 class="mb-6 text-2xl font-bold">Infobip SMS Test (Foreign Numbers)</h1>

		<div class="space-y-4">
			<!-- Test Mode Selection -->
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">Test Mode</label>
				<div class="flex gap-4">
					<label class="flex items-center">
						<input 
							type="radio" 
							bind:group={testMode} 
							value="template"
							class="mr-2"
						/>
						<span class="text-sm">Template SMS (Notification Flow)</span>
					</label>
					<label class="flex items-center">
						<input 
							type="radio" 
							bind:group={testMode} 
							value="direct"
							class="mr-2"
						/>
						<span class="text-sm">Direct SMS</span>
					</label>
				</div>
			</div>

			<div>
				<label for="phone" class="mb-1 block text-sm font-medium text-gray-700">
					Phone Number (with country code)
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phoneNumber}
					placeholder="+491744360256"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-gray-500">
					Enter international number with country code (e.g., +49 for Germany, +82 for South Korea, +1 for USA)
				</p>
			</div>

			{#if testMode === 'template'}
				<!-- Template Selection -->
				<div>
					<label for="template" class="mb-1 block text-sm font-medium text-gray-700">
						Template
					</label>
					<select
						id="template"
						bind:value={selectedTemplate}
						class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
					>
						<option value="signup01">Signup Welcome (signup01)</option>
						<option value="trip01">Trip Registration (trip01)</option>
						<option value="offer01">Offer Arrival (offer01)</option>
						<option value="payment01">Payment Complete (payment01)</option>
						<option value="remind01">Trip Reminder (remind01)</option>
					</select>
				</div>

				<!-- Template Data -->
				<div>
					<label class="mb-1 block text-sm font-medium text-gray-700">
						Template Data (JSON)
					</label>
					<textarea
						value={JSON.stringify(templateData, null, 2)}
						on:input={(e) => {
							try {
								templateData = JSON.parse(e.currentTarget.value);
							} catch {}
						}}
						rows="5"
						class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs focus:ring-2 focus:outline-none"
					/>
				</div>
			{:else}
				<!-- Direct Message -->
				<div>
					<label for="message" class="mb-1 block text-sm font-medium text-gray-700"> Message </label>
					<textarea
						id="message"
						bind:value={message}
						rows="3"
						class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
					/>
				</div>
			{/if}

			<button
				onclick={sendTestSMS}
				disabled={loading || !phoneNumber}
				class="bg-primary w-full rounded-md px-4 py-2 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-400"
			>
				{loading ? 'Sending...' : testMode === 'template' ? 'Send Template SMS' : 'Send Direct SMS'}
			</button>
		</div>

		{#if error}
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
				<p class="text-sm text-red-700">Error: {error}</p>
			</div>
		{/if}

		{#if result}
			<div class="mt-4 rounded-md border border-green-200 bg-green-50 p-4">
				<p class="mb-2 text-sm font-medium text-green-700">SMS sent successfully!</p>
				
				{#if result.type === 'notification'}
					<div class="mb-3 rounded border border-green-300 bg-white p-3">
						<p class="mb-2 text-xs font-medium text-gray-700">Template Conversion:</p>
						<p class="text-xs text-gray-600 mb-1">Template: {result.result?.originalTemplate}</p>
						<p class="text-xs text-gray-600 mb-1">Formatted Phone: {result.result?.formattedPhone}</p>
						<div class="mt-2">
							<p class="text-xs font-medium text-gray-700 mb-1">SMS Message:</p>
							<p class="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">{result.result?.formattedMessage}</p>
						</div>
					</div>
				{/if}
				
				<pre class="overflow-x-auto text-xs">{JSON.stringify(result, null, 2)}</pre>

				{#if result.result?.messages?.[0]}
					<div class="mt-3 rounded border border-green-300 bg-white p-3">
						<p class="mb-1 text-xs font-medium text-gray-700">Message Details:</p>
						<p class="text-xs text-gray-600">Message ID: {result.result.messages[0].messageId}</p>
						<p class="text-xs text-gray-600">
							Status: {result.result.messages[0].status.name} - {result.result.messages[0].status
								.description}
						</p>
						<p class="text-xs text-gray-600">Group: {result.result.messages[0].status.groupName}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<div class="mx-auto mt-6 max-w-md rounded-lg bg-blue-50 p-4">
		<h2 class="mb-2 font-semibold text-blue-900">SMS Testing Information:</h2>
		<ul class="space-y-1 text-sm text-blue-800">
			<li>• <strong>Template Mode:</strong> Tests the full notification flow with template conversion</li>
			<li>• <strong>Direct Mode:</strong> Sends raw SMS message directly</li>
			<li>• <strong>Foreign Numbers:</strong> Automatically formatted with country code</li>
			<li>• <strong>Default Number:</strong> +491744360256 (German mobile)</li>
		</ul>
		<h3 class="mt-3 mb-1 font-semibold text-blue-900">Required Environment Variables:</h3>
		<ul class="space-y-1 text-sm text-blue-800">
			<li>• INFOBIP_API_KEY</li>
			<li>• INFOBIP_BASE_URL</li>
			<li>• INFOBIP_SENDER (optional)</li>
		</ul>
		<p class="mt-3 text-xs text-blue-700">
			Debug logs are enabled on the server. Check server console for detailed SMS sending logs.
		</p>
	</div>
</div>

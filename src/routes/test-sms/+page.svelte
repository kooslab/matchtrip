<script lang="ts">
	let phoneNumber = '';
	let message = 'Test message from MatchTrip';
	let loading = false;
	let result: any = null;
	let error: string | null = null;

	async function sendTestSMS() {
		loading = true;
		error = null;
		result = null;

		try {
			const response = await fetch('/api/test-sms', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					to: phoneNumber,
					text: message
				})
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
	<div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
		<h1 class="text-2xl font-bold mb-6">Infobip SMS Test</h1>
		
		<div class="space-y-4">
			<div>
				<label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
					Phone Number (with country code)
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phoneNumber}
					placeholder="+821012345678"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary"
				/>
				<p class="text-xs text-gray-500 mt-1">For South Korea, use +82 followed by the number without leading 0</p>
			</div>
			
			<div>
				<label for="message" class="block text-sm font-medium text-gray-700 mb-1">
					Message
				</label>
				<textarea
					id="message"
					bind:value={message}
					rows="3"
					class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-color-primary"
				/>
			</div>
			
			<button
				onclick={sendTestSMS}
				disabled={loading || !phoneNumber}
				class="w-full py-2 px-4 bg-color-primary text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
			>
				{loading ? 'Sending...' : 'Send Test SMS'}
			</button>
		</div>
		
		{#if error}
			<div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
				<p class="text-sm text-red-700">Error: {error}</p>
			</div>
		{/if}
		
		{#if result}
			<div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
				<p class="text-sm text-green-700 font-medium mb-2">SMS sent successfully!</p>
				<pre class="text-xs overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
				
				{#if result.result?.messages?.[0]}
					<div class="mt-3 p-3 bg-white rounded border border-green-300">
						<p class="text-xs font-medium text-gray-700 mb-1">Message Details:</p>
						<p class="text-xs text-gray-600">Message ID: {result.result.messages[0].messageId}</p>
						<p class="text-xs text-gray-600">Status: {result.result.messages[0].status.name} - {result.result.messages[0].status.description}</p>
						<p class="text-xs text-gray-600">Group: {result.result.messages[0].status.groupName}</p>
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
			<li>• INFOBIP_SENDER (required)</li>
		</ul>
		<p class="text-xs text-blue-700 mt-3">
			Note: For South Korea, you might need to register your sender ID with local carriers. 
			The sender can be a phone number or alphanumeric ID (max 11 characters).
		</p>
	</div>
</div>
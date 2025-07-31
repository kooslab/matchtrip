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
	<div class="mx-auto max-w-md rounded-lg bg-white p-6 shadow-md">
		<h1 class="mb-6 text-2xl font-bold">Infobip SMS Test</h1>

		<div class="space-y-4">
			<div>
				<label for="phone" class="mb-1 block text-sm font-medium text-gray-700">
					Phone Number (with country code)
				</label>
				<input
					id="phone"
					type="tel"
					bind:value={phoneNumber}
					placeholder="+821012345678"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				/>
				<p class="mt-1 text-xs text-gray-500">
					For South Korea, use +82 followed by the number without leading 0
				</p>
			</div>

			<div>
				<label for="message" class="mb-1 block text-sm font-medium text-gray-700"> Message </label>
				<textarea
					id="message"
					bind:value={message}
					rows="3"
					class="focus:ring-color-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:outline-none"
				/>
			</div>

			<button
				onclick={sendTestSMS}
				disabled={loading || !phoneNumber}
				class="bg-color-primary w-full rounded-md px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
			>
				{loading ? 'Sending...' : 'Send Test SMS'}
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
		<h2 class="mb-2 font-semibold text-blue-900">Required Environment Variables:</h2>
		<ul class="space-y-1 text-sm text-blue-800">
			<li>• INFOBIP_API_KEY (required)</li>
			<li>• INFOBIP_BASE_URL (required)</li>
			<li>• INFOBIP_SENDER (required)</li>
		</ul>
		<p class="mt-3 text-xs text-blue-700">
			Note: For South Korea, you might need to register your sender ID with local carriers. The
			sender can be a phone number or alphanumeric ID (max 11 characters).
		</p>
	</div>
</div>

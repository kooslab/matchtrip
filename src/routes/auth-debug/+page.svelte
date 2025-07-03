<script lang="ts">
	import { onMount } from 'svelte';

	let authTest = $state(null);
	let errors = $state([]);
	let loading = $state(true);

	onMount(async () => {
		try {
			// Fetch auth test results
			const testRes = await fetch('/api/auth/test');
			authTest = await testRes.json();

			// Fetch recent errors
			const errorsRes = await fetch('/api/auth/errors?minutes=60');
			const errorsData = await errorsRes.json();
			errors = errorsData.errors || [];
		} catch (err) {
			console.error('Failed to load debug data:', err);
		} finally {
			loading = false;
		}
	});

	function clearErrors() {
		fetch('/api/auth/errors', { method: 'POST' })
			.then(() => {
				errors = [];
				alert('Error log cleared');
			})
			.catch((err) => console.error('Failed to clear errors:', err));
	}
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="mx-auto max-w-6xl">
		<h1 class="mb-8 text-3xl font-bold">Auth Debug Dashboard</h1>

		{#if loading}
			<p class="text-gray-600">Loading debug information...</p>
		{:else}
			<!-- Auth Configuration Test -->
			<div class="mb-8 rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-xl font-semibold">Auth Configuration</h2>
				{#if authTest}
					<div class="space-y-4">
						<div>
							<h3 class="font-medium text-gray-700">Status</h3>
							<p class="text-sm {authTest.status === 'ok' ? 'text-green-600' : 'text-red-600'}">
								{authTest.status}
							</p>
						</div>

						<div>
							<h3 class="font-medium text-gray-700">Environment Variables</h3>
							<ul class="space-y-1 text-sm">
								{#each Object.entries(authTest.environment || {}) as [key, value]}
									<li class="flex items-center gap-2">
										<span class="font-mono">{key}:</span>
										<span class={value ? 'text-green-600' : 'text-red-600'}>
											{value || 'NOT SET'}
										</span>
									</li>
								{/each}
							</ul>
						</div>

						<div>
							<h3 class="font-medium text-gray-700">Session Status</h3>
							{#if authTest.session?.hasSession}
								<p class="text-sm text-green-600">
									Logged in as: {authTest.session.email}
								</p>
							{:else}
								<p class="text-sm text-gray-600">
									No active session
									{#if authTest.session?.error}
										<span class="block text-red-600">Error: {authTest.session.error}</span>
									{/if}
								</p>
							{/if}
						</div>

						<div>
							<h3 class="font-medium text-gray-700">Google OAuth Configuration</h3>
							<ul class="space-y-1 text-sm">
								<li>Provider configured: {authTest.authConfig?.hasGoogleProvider ? '✅' : '❌'}</li>
								<li>
									Redirect URI: <code class="bg-gray-100 px-1"
										>{authTest.authConfig?.googleRedirectURI}</code
									>
								</li>
							</ul>
						</div>
					</div>
				{/if}
			</div>

			<!-- Recent Errors -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-xl font-semibold">Recent Auth Errors ({errors.length})</h2>
					<button
						onclick={clearErrors}
						class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
					>
						Clear Errors
					</button>
				</div>

				{#if errors.length === 0}
					<p class="text-gray-600">No recent errors</p>
				{:else}
					<div class="max-h-96 space-y-4 overflow-y-auto">
						{#each errors as error}
							<div class="border-l-4 border-red-500 py-2 pl-4">
								<div class="mb-1 flex items-center gap-2">
									<span class="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
										{error.type}
									</span>
									<span class="text-xs text-gray-500">
										{new Date(error.timestamp).toLocaleString()}
									</span>
								</div>
								<p class="text-sm font-medium">{error.message}</p>
								{#if error.details}
									<pre class="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
{JSON.stringify(error.details, null, 2)}
									</pre>
								{/if}
								{#if error.stack}
									<details class="mt-2">
										<summary class="cursor-pointer text-xs text-gray-600">Stack trace</summary>
										<pre class="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
{error.stack}
										</pre>
									</details>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

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
			.catch(err => console.error('Failed to clear errors:', err));
	}
</script>

<div class="min-h-screen bg-gray-50 p-8">
	<div class="max-w-6xl mx-auto">
		<h1 class="text-3xl font-bold mb-8">Auth Debug Dashboard</h1>
		
		{#if loading}
			<p class="text-gray-600">Loading debug information...</p>
		{:else}
			<!-- Auth Configuration Test -->
			<div class="bg-white rounded-lg shadow-md p-6 mb-8">
				<h2 class="text-xl font-semibold mb-4">Auth Configuration</h2>
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
							<ul class="text-sm space-y-1">
								{#each Object.entries(authTest.environment || {}) as [key, value]}
									<li class="flex items-center gap-2">
										<span class="font-mono">{key}:</span>
										<span class="{value ? 'text-green-600' : 'text-red-600'}">
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
										<span class="text-red-600 block">Error: {authTest.session.error}</span>
									{/if}
								</p>
							{/if}
						</div>
						
						<div>
							<h3 class="font-medium text-gray-700">Google OAuth Configuration</h3>
							<ul class="text-sm space-y-1">
								<li>Provider configured: {authTest.authConfig?.hasGoogleProvider ? '✅' : '❌'}</li>
								<li>Redirect URI: <code class="bg-gray-100 px-1">{authTest.authConfig?.googleRedirectURI}</code></li>
							</ul>
						</div>
					</div>
				{/if}
			</div>
			
			<!-- Recent Errors -->
			<div class="bg-white rounded-lg shadow-md p-6">
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-semibold">Recent Auth Errors ({errors.length})</h2>
					<button 
						onclick={clearErrors}
						class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
					>
						Clear Errors
					</button>
				</div>
				
				{#if errors.length === 0}
					<p class="text-gray-600">No recent errors</p>
				{:else}
					<div class="space-y-4 max-h-96 overflow-y-auto">
						{#each errors as error}
							<div class="border-l-4 border-red-500 pl-4 py-2">
								<div class="flex items-center gap-2 mb-1">
									<span class="text-xs font-semibold px-2 py-1 bg-red-100 text-red-700 rounded">
										{error.type}
									</span>
									<span class="text-xs text-gray-500">
										{new Date(error.timestamp).toLocaleString()}
									</span>
								</div>
								<p class="text-sm font-medium">{error.message}</p>
								{#if error.details}
									<pre class="text-xs mt-2 bg-gray-100 p-2 rounded overflow-x-auto">
{JSON.stringify(error.details, null, 2)}
									</pre>
								{/if}
								{#if error.stack}
									<details class="mt-2">
										<summary class="cursor-pointer text-xs text-gray-600">Stack trace</summary>
										<pre class="text-xs mt-1 bg-gray-100 p-2 rounded overflow-x-auto">
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
<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let error = '';
	let details = '';

	onMount(() => {
		const urlParams = new URLSearchParams($page.url.search);
		error = urlParams.get('error') || 'Unknown error';
		
		// Log the error details for debugging
		console.log('[AUTH ERROR PAGE] Full URL:', $page.url.toString());
		console.log('[AUTH ERROR PAGE] Error code:', error);
		console.log('[AUTH ERROR PAGE] All URL params:', Object.fromEntries(urlParams.entries()));
		
		// Check localStorage for any auth-related data
		const authDebug = localStorage.getItem('auth-debug');
		if (authDebug) {
			console.log('[AUTH ERROR PAGE] Auth debug from localStorage:', authDebug);
			localStorage.removeItem('auth-debug');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
	<div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
		<div>
			<h2 class="text-center text-3xl font-bold text-primary">Authentication Error</h2>
			<div class="mt-4 text-center">
				<p class="text-red-600 font-semibold">Error: {error}</p>
				{#if error === 'email_not_found'}
					<div class="mt-4 text-sm text-gray-600">
						<p>The authentication provider did not return an email address.</p>
						<p class="mt-2">This could happen if:</p>
						<ul class="mt-2 text-left list-disc list-inside">
							<li>You didn't agree to share your email during login</li>
							<li>Your account doesn't have an email associated</li>
							<li>There's a configuration issue with the OAuth provider</li>
						</ul>
					</div>
				{/if}
			</div>
			<div class="mt-6 space-y-3">
				<a href="/login" class="block w-full text-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-color-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-primary">
					Try Again
				</a>
				<a href="/" class="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-color-primary">
					Go Home
				</a>
			</div>
		</div>
		
		<!-- Debug info in development -->
		{#if import.meta.env.DEV}
			<div class="mt-4 p-4 bg-gray-100 rounded text-xs">
				<p class="font-semibold">Debug Info:</p>
				<pre class="mt-2 overflow-x-auto">{JSON.stringify({ error, url: $page.url.toString() }, null, 2)}</pre>
			</div>
		{/if}
	</div>
</div>
</script>
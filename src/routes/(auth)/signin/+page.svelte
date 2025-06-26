<script lang="ts">
	import { signIn } from '$lib/authClient';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/Button.svelte';
	import { resetAllStores } from '$lib/stores/resetStores';
	import { browser } from '$app/environment';

	let error = $state('');
	let isLoading = $state(false);

	async function handleGoogleSignIn() {
		isLoading = true;
		error = '';
		try {
			console.log('[SIGNIN] Initiating Google sign-in');
			const result = await signIn.social({
				provider: 'google'
			});
			console.log('[SIGNIN] Google sign-in result:', result);
		} catch (err) {
			console.error('[SIGNIN] Google sign in error:', err);
			console.error('[SIGNIN] Error details:', {
				message: err?.message,
				stack: err?.stack,
				response: err?.response
			});
			
			// Log error to server
			if (browser) {
				try {
					await fetch('/api/auth/errors', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							type: 'signin',
							message: 'Google sign-in failed',
							details: {
								error: err?.message,
								userAgent: navigator.userAgent,
								timestamp: new Date().toISOString()
							}
						})
					});
				} catch (logError) {
					console.error('[SIGNIN] Failed to log error:', logError);
				}
			}
			
			error = err?.message || 'Google 로그인에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
	<img src="/logo.jpg" alt="MatchTrip Logo" class="mb-8 h-48 w-auto object-contain shadow" />
	<div class="flex w-full max-w-xs flex-col gap-4">
		<h1 class="text-2xl font-bold text-center text-gray-800 mb-4">로그인</h1>
		<button
			type="button"
			onclick={handleGoogleSignIn}
			disabled={isLoading}
			class="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
			<svg class="h-5 w-5" viewBox="0 0 24 24">
				<path
					fill="#4285F4"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
				<path
					fill="#34A853"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
				<path
					fill="#FBBC05"
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
				<path
					fill="#EA4335"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
			</svg>
			Google로 로그인
		</button>
		{#if error}
			<p class="mt-2 text-center text-sm text-red-500">{error}</p>
		{/if}
	</div>
</div>

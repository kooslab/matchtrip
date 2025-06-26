<script lang="ts">
	import { signIn } from '$lib/authClient';
	import { goto } from '$app/navigation';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import Button from '$lib/components/Button.svelte';
	import { onMount } from 'svelte';
	import { resetAllStores } from '$lib/stores/resetStores';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let showPassword = $state(false);
	let successMessage = $state('');

	onMount(() => {
		const verified = $page.url.searchParams.get('verified');
		const reset = $page.url.searchParams.get('reset');
		
		if (verified === 'true') {
			successMessage = '이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.';
		} else if (reset === 'true') {
			successMessage = '비밀번호가 성공적으로 변경되었습니다. 새 비밀번호로 로그인해 주세요.';
		}
	});

	function togglePassword() {
		console.log('togglePassword');
		showPassword = !showPassword;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		console.log('[SIGNIN CLIENT] Form submitted');
		console.log('[SIGNIN CLIENT] Email:', email);
		console.log('[SIGNIN CLIENT] Password length:', password.length);
		
		isLoading = true;
		try {
			console.log('[SIGNIN CLIENT] Starting sign in process...');
			const result = await signIn.email({
				email,
				password,
				rememberMe: true
			});
			
			console.log('[SIGNIN CLIENT] Sign in result:', result);
			console.log('[SIGNIN CLIENT] Result type:', typeof result);
			console.log('[SIGNIN CLIENT] Result keys:', result ? Object.keys(result) : 'null');
			if (result.error) {
				console.error('signIn error - full error object:', result.error);
				console.error('signIn error - error type:', typeof result.error);
				console.error('signIn error - error keys:', result.error ? Object.keys(result.error) : 'null');
				
				// Safely extract error message
				if (result.error && typeof result.error === 'object' && 'message' in result.error) {
					error = String(result.error.message) || '알 수 없는 오류가 발생했습니다.';
				} else if (typeof result.error === 'string') {
					error = result.error;
				} else {
					error = '알 수 없는 오류가 발생했습니다.';
				}
			} else {
				console.log('[SIGNIN CLIENT] Sign in successful');
				
				// 로그인 성공 - 먼저 모든 스토어 리셋
				console.log('[SIGNIN CLIENT] Resetting all stores');
				resetAllStores();
				
				// 모든 데이터 무효화
				console.log('[SIGNIN CLIENT] Invalidating all data');
				await invalidateAll();

				// Wait a bit to ensure session is properly established
				console.log('[SIGNIN CLIENT] Waiting for session establishment');
				await new Promise(resolve => setTimeout(resolve, 100));

				// Get user role from the result or make a quick API call
				try {
					console.log('[SIGNIN CLIENT] Fetching user role');
					const response = await fetch('/api/user/role');
					console.log('[SIGNIN CLIENT] Role response status:', response.status);
					const data = await response.json();
					console.log('[SIGNIN CLIENT] Role data:', data);

					if (data.role === 'guide') {
						await goto('/trips');
					} else {
						await goto('/my-trips');
					}
				} catch {
					// Fallback to home if role check fails
					await goto('/');
				}
			}
		} catch (err) {
			console.error('Caught error during sign in:', err);
			console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace');
			error = '로그인 중 오류가 발생했습니다. 다시 시도해 주세요.';
		} finally {
			isLoading = false;
		}
	}

	async function handleGoogleSignIn() {
		isLoading = true;
		try {
			await signIn.social({
				provider: 'google'
			});
		} catch (err) {
			console.error('Google sign in error:', err);
			error = 'Google 로그인에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
	<img src="/logo.jpg" alt="MatchTrip Logo" class="mb-8 h-48 w-auto object-contain shadow" />
	{#if successMessage}
		<div class="mb-4 w-full max-w-xs rounded-md bg-green-50 p-4">
			<p class="text-sm text-green-800">{successMessage}</p>
		</div>
	{/if}
	<form class="flex w-full max-w-xs flex-col gap-4" onsubmit={handleSubmit}>
		<input
			type="email"
			placeholder="Email"
			class="rounded-md border border-gray-300 p-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
			bind:value={email}
			disabled={isLoading} />
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-gray-700">비밀번호</span>
			<div class="relative">
				<input
					type={showPassword ? 'text' : 'password'}
					placeholder="Password"
					class="w-full rounded-md border border-gray-300 p-2 pr-10 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
					bind:value={password}
					disabled={isLoading}
					required />
				<button
					type="button"
					tabindex="-1"
					class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
					onclick={togglePassword}
					aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>
					{#if showPassword}
						<!-- Eye Off Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" /><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
					{:else}
						<!-- Eye Icon -->
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
					{/if}
				</button>
			</div>
		</label>
		<Button type="submit" loading={isLoading} loadingText="로그인 중..." class="mt-2 w-full"
			>로그인</Button>
		{#if error}
			<p class="mt-2 text-center text-sm text-red-500">{error}</p>
		{/if}
		<div class="mt-4 flex items-center justify-between">
			<a href="/forgot-password" class="text-sm text-blue-500 hover:underline">
				비밀번호를 잊으셨나요?
			</a>
		</div>
		
		<div class="relative my-6">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-gray-300"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="bg-gradient-to-br from-blue-50 to-green-50 px-2 text-gray-500">또는</span>
			</div>
		</div>
		
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
		<p class="mt-6 text-center text-sm text-gray-500">
			계정이 없으신가요?
			<a href="/signup" class="ml-1 text-blue-500 hover:underline">회원가입</a>
		</p>
	</form>
</div>

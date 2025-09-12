<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import bgImage from '$lib/images/bg.png';
	
	// Loading states for social login
	let loadingProvider = $state<'kakao' | 'google' | null>(null);
	
	// Check for redirect after login
	onMount(() => {
		// If user lands here but is already logged in, redirect them
		const checkAuth = async () => {
			try {
				const response = await fetch('/api/user/profile');
				if (response.ok) {
					// User is logged in, check for redirect or go to home
					const redirectTo = sessionStorage.getItem('redirectAfterLogin');
					if (redirectTo) {
						sessionStorage.removeItem('redirectAfterLogin');
						goto(redirectTo);
					} else {
						goto('/');
					}
				}
			} catch (error) {
				// Not logged in, stay on login page
			}
		};
		checkAuth();
	});
</script>

<div class="relative mx-auto h-screen w-full max-w-[430px] overflow-hidden">
	<!-- Background Image -->
	<div
		class="absolute inset-0 bg-cover bg-center bg-no-repeat"
		style="background-image: url({bgImage})"
	>
		<!-- Dark overlay -->
		<div class="absolute inset-0 bg-black/30"></div>
	</div>

	<!-- Content -->
	<div class="relative z-10 flex h-full flex-col justify-center py-8">
		<!-- Back button -->
		<button
			onclick={() => goto('/')}
			class="absolute left-4 top-4 rounded-full bg-white/20 p-2 backdrop-blur-sm transition-colors hover:bg-white/30"
		>
			<svg class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
			</svg>
		</button>

		<!-- Main content -->
		<div class="flex flex-col items-center px-8 text-center text-white">
			<h1
				class="mb-4 text-5xl font-bold text-white lg:mb-3 lg:text-4xl"
				style="font-family: 'Pretendard', sans-serif;"
			>
				Matchtrip
			</h1>
			<p class="mb-8 text-lg text-gray-300 lg:mb-6 lg:text-base">
				Match Your Trip, Make It Yours
			</p>

			<!-- Sign in text -->
			<p class="mb-6 text-center text-white lg:mb-4">로그인하여 여행을 시작하세요</p>

			<!-- Social login buttons -->
			<div class="mb-8 flex justify-center gap-4 lg:mb-4">
				<button
					onclick={async () => {
						if (loadingProvider) return;
						loadingProvider = 'kakao';
						try {
							const { signIn } = await import('$lib/authClient');
							// Store redirect URL before login
							const redirectTo = sessionStorage.getItem('redirectAfterLogin');
							await signIn.social({
								provider: 'kakao',
								callbackURL: redirectTo || '/'
							});
						} catch (error) {
							console.error('Kakao login error:', error);
							window.alert('카카오 로그인에 실패했습니다.');
							loadingProvider = null;
						}
					}}
					class="relative flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={loadingProvider !== null}
				>
					{#if loadingProvider === 'kakao'}
						<div class="absolute inset-0 flex items-center justify-center">
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"
							></div>
						</div>
					{:else}
						<svg class="h-6 w-6" viewBox="0 0 24 24">
							<path
								fill="#000000"
								d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.939-.123.49.18.483.376.351.155-.103 2.466-1.675 3.464-2.353.541.08 1.1.12 1.67.12 4.97 0 9-3.186 9-7.116C21 6.185 16.97 3 12 3z"
							/>
						</svg>
					{/if}
				</button>
				<button
					onclick={async () => {
						if (loadingProvider) return;
						loadingProvider = 'google';
						try {
							const { signIn } = await import('$lib/authClient');
							// Store redirect URL before login
							const redirectTo = sessionStorage.getItem('redirectAfterLogin');
							await signIn.social({
								provider: 'google',
								callbackURL: redirectTo || '/'
							});
						} catch (error) {
							console.error('Google login error:', error);
							window.alert('구글 로그인에 실패했습니다.');
							loadingProvider = null;
						}
					}}
					class="relative flex h-12 w-12 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={loadingProvider !== null}
				>
					{#if loadingProvider === 'google'}
						<div class="absolute inset-0 flex items-center justify-center">
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"
							></div>
						</div>
					{:else}
						<svg class="h-6 w-6" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
					{/if}
				</button>
			</div>

			<!-- Alternative action -->
			<p class="text-sm text-white/80">
				계정이 없으신가요? 
				<button 
					onclick={() => goto('/')}
					class="font-semibold text-white hover:underline"
				>
					둘러보기
				</button>
			</p>

			<!-- Bottom text -->
			<p class="mt-8 text-center text-sm text-white/60">@Matchtrip.corp.</p>

			<!-- Bottom bar indicator - mobile only -->
			<div class="mt-8 flex justify-center lg:hidden">
				<div class="h-1 w-32 rounded-full bg-white"></div>
			</div>
		</div>
	</div>
</div>
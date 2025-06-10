<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import { useSession, sendVerificationEmail, verifyEmail } from '$lib/authClient';
	
	const session = useSession();
	
	export let data;
	
	let resending = false;
	let resendEmail = '';
	let resendMessage = '';
	let verifying = false;
	let error = '';
	let success = false;
	let message = '';

	// Handle token verification on mount
	async function handleTokenVerification(token: string) {
		verifying = true;
		try {
			const response = await verifyEmail({ token });
			
			if (response.error) {
				error = '인증 링크가 만료되었거나 유효하지 않습니다.';
				success = false;
			} else {
				success = true;
				message = '이메일 인증이 완료되었습니다. 이제 로그인할 수 있습니다.';
				setTimeout(() => {
					goto('/signin?verified=true');
				}, 3000);
			}
		} catch (e) {
			error = '이메일 인증 중 오류가 발생했습니다.';
			success = false;
		} finally {
			verifying = false;
		}
	}

	async function resendVerification() {
		console.log('Resend verification clicked');
		if (!resendEmail) {
			resendMessage = '이메일을 입력해주세요.';
			return;
		}

		resending = true;
		resendMessage = '';

		try {
			console.log('Sending verification email to:', resendEmail);
			// Use better-auth's built-in resend verification
			const response = await sendVerificationEmail({
				email: resendEmail,
				callbackURL: '/verify-email'
			});

			console.log('Response:', response);
			
			if (response.error) {
				resendMessage = response.error.message || '인증 이메일 재전송에 실패했습니다.';
			} else {
				resendMessage = '인증 이메일을 재전송했습니다. 이메일을 확인해주세요.';
			}
		} catch (e) {
			console.error('Error sending verification email:', e);
			resendMessage = '인증 이메일 재전송 중 오류가 발생했습니다.';
		} finally {
			resending = false;
		}
	}

	onMount(() => {
		// Handle token verification if present
		if (data.verificationStatus === 'pending' && data.token) {
			handleTokenVerification(data.token);
		}
		
		// If user is logged in but not verified, pre-fill their email
		if ($session?.user && !$session.user.emailVerified) {
			resendEmail = $session.user.email || '';
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h2 class="mt-6 text-3xl font-extrabold text-gray-900">이메일 인증</h2>
		</div>

		<div class="mt-8 bg-white px-8 py-8 shadow sm:rounded-lg sm:px-10">
			{#if verifying}
				<div class="flex flex-col items-center justify-center space-y-4">
					<div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"></div>
					<p class="text-center text-gray-600">이메일을 인증하는 중입니다...</p>
				</div>
			{:else if success}
				<div class="flex flex-col items-center justify-center space-y-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
						<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
					<p class="text-center text-green-600">{message}</p>
					<p class="text-center text-sm text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
				</div>
			{:else if error}
				<div class="flex flex-col items-center justify-center space-y-4">
					<div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
						<svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</div>
					<p class="text-center text-red-600">{error}</p>
					<Button href="/signin" variant="primary" class="mt-4">
						로그인 페이지로 이동
					</Button>
				</div>
			{:else}
				<!-- Resend verification form -->
				<div class="space-y-4">
					<h3 class="text-lg font-medium text-gray-900">이메일 인증 재전송</h3>
					<p class="text-sm text-gray-600">
						이메일 인증 링크를 받지 못하셨나요? 아래에 이메일을 입력하여 다시 전송받으세요.
					</p>
					
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700">이메일</label>
						<input
							type="email"
							id="email"
							bind:value={resendEmail}
							disabled={resending}
							class="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100"
							placeholder="your@email.com"
						/>
					</div>

					{#if resendMessage}
						<p class={`text-sm ${resendMessage.includes('오류') || resendMessage.includes('실패') ? 'text-red-600' : 'text-green-600'}`}>
							{resendMessage}
						</p>
					{/if}

					<div class="flex space-x-2">
						<Button 
							onclick={resendVerification} 
							variant="primary" 
							disabled={resending}
							class="flex-1"
						>
							{resending ? '전송 중...' : '인증 이메일 재전송'}
						</Button>
						<Button href="/signin" variant="secondary" class="flex-1">
							로그인 페이지로
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
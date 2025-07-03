<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let email = $state('');
	let isGoogleUser = $state(false);
	let isLoading = $state(false);
	let emailSent = $state(false);
	let error = $state('');

	// Pre-fill with existing email
	$effect(() => {
		if ($page.data.user?.email) {
			email = $page.data.user.email;
			// Check if this is a Google user (they would have emailVerified as true)
			isGoogleUser = $page.data.user.emailVerified || email.includes('@gmail.com');
		}
	});

	const isValidEmail = $derived(() => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	});

	async function handleSendVerification() {
		if (!isValidEmail() || isLoading) return;

		isLoading = true;
		error = '';

		try {
			// For Google users, skip verification since it's already verified
			if (isGoogleUser) {
				// Just proceed to the next step
				await goto('/onboarding-complete');
				return;
			}

			// For non-Google users, send verification email
			const response = await fetch('/api/user/send-verification', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ email })
			});

			if (!response.ok) {
				throw new Error('Failed to send verification email');
			}

			emailSent = true;
		} catch (err) {
			error = '이메일 전송에 실패했습니다. 다시 시도해주세요.';
		} finally {
			isLoading = false;
		}
	}

	async function handleSkip() {
		// For now, allow skipping email verification
		await goto('/onboarding-complete');
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Progress indicator -->
		<div class="mb-8">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm text-gray-600">4/4</span>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-blue-600 transition-all duration-300"
					style="width: 100%"
				></div>
			</div>
		</div>

		<div class="rounded-xl bg-white p-8 shadow-md">
			{#if !emailSent}
				<h1 class="mb-2 text-2xl font-bold text-gray-900">이메일 인증</h1>
				<p class="mb-8 text-gray-600">
					{isGoogleUser ? '구글 계정으로 가입하셨습니다' : '이메일 주소를 확인해주세요'}
				</p>

				<div class="space-y-6">
					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-gray-700">
							이메일 주소
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="example@email.com"
							class="w-full rounded-lg border px-4 py-3 transition-all outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 {isGoogleUser
								? 'cursor-not-allowed border-gray-200 bg-gray-100'
								: 'border-gray-300'}"
							disabled={isLoading || isGoogleUser}
							readonly={isGoogleUser}
						/>
						{#if isGoogleUser}
							<p class="mt-2 flex items-center gap-2 text-sm text-gray-500">
								<svg
									class="h-4 w-4 text-green-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 13l4 4L19 7"
									></path>
								</svg>
								구글 계정으로 인증됨
							</p>
						{/if}
					</div>

					{#if error}
						<div class="rounded-lg border border-red-200 bg-red-50 p-3">
							<p class="text-sm text-red-600">{error}</p>
						</div>
					{/if}

					<div class="space-y-3">
						{#if isGoogleUser}
							<button
								onclick={() => goto('/onboarding-complete')}
								class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
							>
								계속하기
							</button>
						{:else}
							<button
								onclick={handleSendVerification}
								disabled={!isValidEmail() || isLoading}
								class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
							>
								{isLoading ? '전송 중...' : '인증 메일 발송'}
							</button>

							<button
								onclick={handleSkip}
								class="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-50"
							>
								나중에 하기
							</button>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Email sent state -->
				<div class="text-center">
					<div class="mb-6">
						<div
							class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
						>
							<svg
								class="h-8 w-8 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								></path>
							</svg>
						</div>
					</div>

					<h2 class="mb-2 text-2xl font-bold text-gray-900">인증 메일을 발송했습니다</h2>
					<p class="mb-2 text-gray-600">{email}로</p>
					<p class="mb-8 text-gray-600">인증 메일을 보냈습니다. 이메일을 확인해주세요.</p>

					<button
						onclick={() => goto('/onboarding-complete')}
						class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700"
					>
						계속하기
					</button>

					<p class="mt-6 text-sm text-gray-500">
						이메일이 오지 않나요? 스팸 메일함을 확인해주세요.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

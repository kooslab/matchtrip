<script lang="ts">
	import { goto } from '$app/navigation';
	import { colors } from '$lib/constants/colors';
	import { onMount } from 'svelte';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';

	let { data } = $props();

	// Stack management
	type Step = 'name' | 'phone' | 'birthdate' | 'complete';
	let currentStep = $state<Step>('name');
	let completedSteps = $state<Step[]>([]);

	// Form data
	let formData = $state({
		name: '',
		phone: '',
		birthYear: '',
		birthMonth: '',
		birthDay: ''
	});

	// Phone verification
	let verificationCode = $state('');
	let isVerificationSent = $state(false);
	let verificationTimer = $state(0);
	let timerInterval: number | null = null;

	// Loading states
	let isLoading = $state(false);

	// Form validation
	function canProceed(): boolean {
		switch (currentStep) {
			case 'name':
				return formData.name.trim().length >= 2;
			case 'phone':
				return formData.phone.length === 11 && verificationCode.length === 6;
			case 'birthdate':
				return (
					formData.birthYear.length === 4 &&
					formData.birthMonth.length > 0 &&
					formData.birthDay.length > 0
				);
			default:
				return false;
		}
	}

	// Handle next step
	async function handleNext() {
		if (!canProceed()) return;

		isLoading = true;

		try {
			switch (currentStep) {
				case 'name':
					// Just move to next step for name
					completedSteps = [...completedSteps, 'name'];
					currentStep = 'phone';
					break;

				case 'phone':
					// Verify phone code
					const verifyResponse = await fetch('/api/auth/verify-phone', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							phone: formData.phone,
							code: verificationCode
						})
					});

					if (verifyResponse.ok) {
						completedSteps = [...completedSteps, 'phone'];
						currentStep = 'birthdate';
					} else {
						alert('인증번호가 올바르지 않습니다.');
					}
					break;

				case 'birthdate':
					// Save all data
					const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;

					const response = await fetch('/api/user/profile', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							name: formData.name,
							phone: formData.phone,
							birthDate: birthDate
						})
					});

					if (response.ok) {
						completedSteps = [...completedSteps, 'birthdate'];
						currentStep = 'complete';
						// Redirect after a short delay
						setTimeout(() => {
							goto('/');
						}, 2000);
					} else {
						alert('프로필 저장에 실패했습니다.');
					}
					break;
			}
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// Send verification code
	async function sendVerificationCode() {
		if (formData.phone.length !== 11) {
			alert('올바른 휴대폰 번호를 입력해주세요.');
			return;
		}

		try {
			const response = await fetch('/api/auth/send-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone: formData.phone })
			});

			if (response.ok) {
				isVerificationSent = true;
				startTimer();
			} else {
				alert('인증번호 전송에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		}
	}

	// Timer for verification code
	function startTimer() {
		verificationTimer = 180; // 3 minutes
		timerInterval = setInterval(() => {
			verificationTimer--;
			if (verificationTimer <= 0 && timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		}, 1000);
	}

	// Format timer display
	function formatTimer(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// Clean up timer on unmount
	onMount(() => {
		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white shadow-sm">
		<div class="flex h-14 items-center px-4">
			<h1 class="text-lg font-semibold text-gray-900">프로필 설정</h1>
		</div>
	</header>

	<!-- Content -->
	<div class="px-4 py-6">
		<div class="mx-auto max-w-sm space-y-4">
			<!-- Current Step -->
			{#if currentStep === 'name'}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-900">이름을 입력해주세요</h2>

					<div>
						<label for="name" class="mb-2 block text-sm font-medium text-gray-700"> 이름 </label>
						<input
							id="name"
							type="text"
							bind:value={formData.name}
							placeholder="홍길동"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-1 focus:outline-none"
							style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
							onfocus={(e) => (e.target.style.borderColor = colors.primary)}
							onblur={(e) => (e.target.style.borderColor = '')}
						/>
					</div>
				</div>
			{:else if currentStep === 'phone'}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-900">휴대폰 번호를 인증해주세요</h2>

					<div class="space-y-4">
						<div>
							<label for="phone" class="mb-2 block text-sm font-medium text-gray-700">
								휴대폰 번호
							</label>
							<div class="flex gap-2">
								<input
									id="phone"
									type="tel"
									bind:value={formData.phone}
									placeholder="01012345678"
									maxlength="11"
									disabled={isVerificationSent}
									class="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-1 focus:outline-none disabled:bg-gray-50"
									style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
									onfocus={(e) => (e.target.style.borderColor = colors.primary)}
									onblur={(e) => (e.target.style.borderColor = '')}
								/>
								<button
									onclick={sendVerificationCode}
									disabled={isVerificationSent || formData.phone.length !== 11}
									class="rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors disabled:opacity-50"
									style="background-color: {isVerificationSent || formData.phone.length !== 11
										? '#CBD5E1'
										: colors.primary}"
								>
									{isVerificationSent ? '재전송' : '인증번호'}
								</button>
							</div>
						</div>

						{#if isVerificationSent}
							<div>
								<label for="code" class="mb-2 block text-sm font-medium text-gray-700">
									인증번호
								</label>
								<div class="flex items-center gap-2">
									<input
										id="code"
										type="text"
										bind:value={verificationCode}
										placeholder="6자리 숫자"
										maxlength="6"
										class="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-1 focus:outline-none"
										style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
										onfocus={(e) => (e.target.style.borderColor = colors.primary)}
										onblur={(e) => (e.target.style.borderColor = '')}
									/>
									{#if verificationTimer > 0}
										<span class="text-sm" style="color: {colors.primary}">
											{formatTimer(verificationTimer)}
										</span>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{:else if currentStep === 'birthdate'}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-900">생년월일을 입력해주세요</h2>

					<div class="flex gap-2">
						<div class="flex-1">
							<label for="year" class="mb-2 block text-sm font-medium text-gray-700"> 년 </label>
							<input
								id="year"
								type="text"
								bind:value={formData.birthYear}
								placeholder="1990"
								maxlength="4"
								class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-1 focus:outline-none"
								style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
								onfocus={(e) => (e.target.style.borderColor = colors.primary)}
								onblur={(e) => (e.target.style.borderColor = '')}
							/>
						</div>
						<div class="w-24">
							<label for="month" class="mb-2 block text-sm font-medium text-gray-700"> 월 </label>
							<input
								id="month"
								type="text"
								bind:value={formData.birthMonth}
								placeholder="1"
								maxlength="2"
								class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-1 focus:outline-none"
								style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
								onfocus={(e) => (e.target.style.borderColor = colors.primary)}
								onblur={(e) => (e.target.style.borderColor = '')}
							/>
						</div>
						<div class="w-24">
							<label for="day" class="mb-2 block text-sm font-medium text-gray-700"> 일 </label>
							<input
								id="day"
								type="text"
								bind:value={formData.birthDay}
								placeholder="1"
								maxlength="2"
								class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-1 focus:outline-none"
								style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
								onfocus={(e) => (e.target.style.borderColor = colors.primary)}
								onblur={(e) => (e.target.style.borderColor = '')}
							/>
						</div>
					</div>
				</div>
			{:else if currentStep === 'complete'}
				<div class="rounded-lg bg-white p-12 text-center shadow-sm">
					<div class="mb-4">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
							style="background-color: {colors.primary}"
						>
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					</div>
					<h2 class="mb-2 text-xl font-bold text-gray-900">프로필 설정 완료!</h2>
					<p class="text-gray-600">잠시 후 홈 화면으로 이동합니다.</p>
				</div>
			{/if}

			<!-- Completed Steps Stack (below current step) -->
			{#each completedSteps as step}
				<div class="rounded-lg bg-white p-4 shadow-sm">
					{#if step === 'name'}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs text-gray-500">이름</p>
								<p class="font-medium text-gray-900">{formData.name}</p>
							</div>
							<svg
								class="h-5 w-5 text-green-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					{:else if step === 'phone'}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs text-gray-500">휴대폰 번호</p>
								<p class="font-medium text-gray-900">
									{formData.phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')}
								</p>
							</div>
							<svg
								class="h-5 w-5 text-green-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					{:else if step === 'birthdate'}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs text-gray-500">생년월일</p>
								<p class="font-medium text-gray-900">
									{formData.birthYear}년 {formData.birthMonth}월 {formData.birthDay}일
								</p>
							</div>
							<svg
								class="h-5 w-5 text-green-500"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Bottom Button -->
	{#if currentStep !== 'complete'}
		<div
			class="fixed right-0 bottom-0 left-0 bg-white px-4 py-4 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]"
		>
			<button
				onclick={handleNext}
				disabled={!canProceed() || isLoading}
				class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all
					{canProceed() && !isLoading ? '' : 'cursor-not-allowed opacity-50'}"
				style="background-color: {canProceed() && !isLoading ? colors.primary : '#CBD5E1'}"
			>
				{isLoading ? '처리중...' : '다음'}
			</button>
		</div>
	{/if}
</div>

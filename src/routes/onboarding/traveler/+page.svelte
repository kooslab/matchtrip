<script lang="ts">
	import { goto } from '$app/navigation';
	import { colors } from '$lib/constants/colors';
	import { onMount } from 'svelte';
	import arrowLeftUrl from '$lib/icons/icon-arrow-back-android-mono.svg';
	import { onboardingStore } from '$lib/stores/onboardingStore';

	let { data } = $props();

	// Get initial data from store
	let storeData = onboardingStore.get();

	// Form data - initialize with store data if available
	let formData = $state({
		name: storeData.name || '',
		phone: storeData.phone || '',
		birthYear: storeData.birthYear || '',
		birthMonth: storeData.birthMonth || '',
		birthDay: storeData.birthDay || ''
	});

	// Phone verification
	let verificationCode = $state('');
	let isVerificationSent = $state(false);
	let verificationTimer = $state(0);
	let timerInterval: number | null = null;
	let isVerified = $state(false);

	// Loading states
	let isLoading = $state(false);
	let isSendingCode = $state(false);
	let isVerifying = $state(false);

	// Error message
	let verificationError = $state('');

	// Track last verified code to prevent duplicate verifications
	let lastVerifiedCode = $state('');

	// Step visibility
	let showPhoneStep = $state(false);
	let showVerificationStep = $state(false);
	let nameCompleted = $state(false);
	let phoneCompleted = $state(false);

	// Track previous states to detect actual changes
	let prevStates = $state({
		showPhoneStep: false,
		showVerificationStep: false,
		nameCompleted: false,
		phoneCompleted: false
	});

	// Auto-scroll to top when step changes
	$effect(() => {
		// Check if any state actually changed
		const stateChanged = 
			prevStates.showPhoneStep !== showPhoneStep ||
			prevStates.showVerificationStep !== showVerificationStep ||
			prevStates.nameCompleted !== nameCompleted ||
			prevStates.phoneCompleted !== phoneCompleted;
		
		if (stateChanged) {
			window.scrollTo({ top: 0, behavior: 'instant' });
			
			// Update previous states
			prevStates = {
				showPhoneStep,
				showVerificationStep,
				nameCompleted,
				phoneCompleted
			};
		}
	});

	// Form validation
	function canProceedName(): boolean {
		return formData.name.trim().length >= 2;
	}

	function canProceedPhone(): boolean {
		return formData.phone.length === 11;
	}

	function canProceedVerification(): boolean {
		return verificationCode.length === 6 && isVerified;
	}

	// Handle name completion
	function handleNameComplete() {
		if (!canProceedName()) return;

		// Save to store
		onboardingStore.setData({
			name: formData.name,
			phone: formData.phone,
			birthYear: formData.birthYear,
			birthMonth: formData.birthMonth,
			birthDay: formData.birthDay
		});

		// Add a small delay to prevent UI flickering during loading
		setTimeout(() => {
			nameCompleted = true;
			showPhoneStep = true;
			// Scroll to top
			window.scrollTo({ top: 0, behavior: 'instant' });
			// Focus on phone input after a short delay
			setTimeout(() => {
				document.getElementById('phone')?.focus();
			}, 100);
		}, 100);
	}

	// Send verification code
	async function sendVerificationCode() {
		if (!canProceedPhone()) {
			alert('올바른 휴대폰 번호를 입력해주세요.');
			return;
		}

		// Save to store before sending verification
		onboardingStore.setData({
			name: formData.name,
			phone: formData.phone,
			birthYear: formData.birthYear,
			birthMonth: formData.birthMonth,
			birthDay: formData.birthDay
		});

		isSendingCode = true;

		try {
			const response = await fetch('/api/phone/send-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ phone: formData.phone })
			});

			const data = await response.json();

			if (response.ok) {
				isVerificationSent = true;
				showVerificationStep = true;
				// Scroll to top
				window.scrollTo({ top: 0, behavior: 'instant' });
				startTimer();
				// Focus on verification input
				setTimeout(() => {
					document.getElementById('code')?.focus();
				}, 100);
			} else {
				// Show the specific error message from the server
				alert(data.message || '인증번호 전송에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isSendingCode = false;
		}
	}

	// Verify code and complete
	async function verifyCode(isAutoVerify = false) {
		if (verificationCode.length !== 6) return;

		// Prevent duplicate verification calls
		if (isVerifying || isLoading) return;

		// Skip if we already verified this exact code for auto-verify
		if (isAutoVerify && lastVerifiedCode === verificationCode) {
			return;
		}

		// If already verified and user clicks Next, just proceed
		if (!isAutoVerify && isVerified && lastVerifiedCode === verificationCode) {
			phoneCompleted = true;
			// Clear timer
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
			// Save data to store and redirect to profile page
			onboardingStore.setData({
				name: formData.name,
				phone: formData.phone,
				birthYear: formData.birthYear,
				birthMonth: formData.birthMonth,
				birthDay: formData.birthDay
			});
			await goto('/onboarding/traveler/profile');
			return;
		}

		// For auto-verify, reset error
		if (isAutoVerify) {
			verificationError = '';
		}

		isVerifying = true;
		if (!isAutoVerify) {
			isLoading = true;
		}

		try {
			const verifyResponse = await fetch('/api/phone/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: formData.phone,
					code: verificationCode
				})
			});

			const data = await verifyResponse.json();

			if (verifyResponse.ok && data.success) {
				isVerified = true;
				verificationError = '';
				lastVerifiedCode = verificationCode;

				// Only proceed to next page if manually submitted (not auto-verify)
				if (!isAutoVerify) {
					phoneCompleted = true;
					// Clear timer
					if (timerInterval) {
						clearInterval(timerInterval);
						timerInterval = null;
					}
					// Save data to store and redirect to profile page
					onboardingStore.setData({
						name: formData.name,
						phone: formData.phone,
						birthYear: formData.birthYear,
						birthMonth: formData.birthMonth,
						birthDay: formData.birthDay
					});
					await goto('/onboarding/traveler/profile');
				}
			} else {
				isVerified = false;
				verificationError = data.message || '인증번호가 올바르지 않습니다.';
				lastVerifiedCode = ''; // Reset on failure
			}
		} catch (error) {
			console.error('Error:', error);
			isVerified = false;
			verificationError = '오류가 발생했습니다.';
		} finally {
			isVerifying = false;
			isLoading = false;
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

	// Load data from store and set initial state
	onMount(() => {
		// If we have name data, show it as completed
		if (formData.name) {
			nameCompleted = true;
			showPhoneStep = true;

			// If we also have phone data, show it as completed
			if (formData.phone) {
				phoneCompleted = true;
				showVerificationStep = false;
			}
		}

		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});

	// Handle back
	function handleBack() {
		// Save current data to store before going back
		onboardingStore.setData({
			name: formData.name,
			phone: formData.phone,
			birthYear: formData.birthYear,
			birthMonth: formData.birthMonth,
			birthDay: formData.birthDay
		});
		history.back();
	}

	// Edit name
	function editName() {
		// Save current data to store before editing
		onboardingStore.setData({
			name: formData.name,
			phone: formData.phone,
			birthYear: formData.birthYear,
			birthMonth: formData.birthMonth,
			birthDay: formData.birthDay
		});

		nameCompleted = false;
		showPhoneStep = false;
		showVerificationStep = false;
		isVerificationSent = false;
		verificationCode = '';
		isVerified = false;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'instant' });
		setTimeout(() => {
			document.getElementById('name')?.focus();
		}, 100);
	}

	// Edit phone
	function editPhone() {
		// Save current data to store before editing
		onboardingStore.setData({
			name: formData.name,
			phone: formData.phone,
			birthYear: formData.birthYear,
			birthMonth: formData.birthMonth,
			birthDay: formData.birthDay
		});

		isVerificationSent = false;
		showVerificationStep = false;
		verificationCode = '';
		isVerified = false;
		verificationError = '';
		lastVerifiedCode = '';
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		// Scroll to top
		window.scrollTo({ top: 0, behavior: 'instant' });
		setTimeout(() => {
			document.getElementById('phone')?.focus();
		}, 100);
	}
</script>

<div class="min-h-screen overflow-x-hidden bg-white">
	<div class="mx-auto w-full px-4" style="max-width: min(100vw, 430px);">
		<!-- Header -->
		<header class="sticky top-0 z-10 bg-white shadow-sm">
			<div class="flex h-14 items-center px-4">
				<button onclick={handleBack} class="mr-4 -ml-2 p-2">
					<img
						src={arrowLeftUrl}
						alt="뒤로가기"
						class="h-5 w-5"
						style="filter: invert(37%) sepia(94%) saturate(2831%) hue-rotate(196deg) brightness(101%) contrast(91%);"
					/>
				</button>
			</div>
		</header>

		<!-- Content -->
		<div class="py-6">
			<!-- Title -->
			<div class="mb-6">
				<h2 class="mb-2 text-lg font-semibold text-gray-900">회원가입</h2>
				<p class="text-sm text-gray-500">사용자 정보를 입력해주세요</p>
			</div>

			<!-- Steps Stack (Reversed Order - New on Top) -->
			<div class="space-y-4">
				<!-- Verification Step (Shows at top when active) -->
				{#if showVerificationStep && !phoneCompleted}
					<div class="rounded-lg bg-white p-6 shadow-sm">
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
									inputmode="numeric"
									pattern="[0-9]*"
									class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-1 focus:outline-none"
									style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
									onfocus={(e) => (e.target.style.borderColor = colors.primary)}
									onblur={(e) => (e.target.style.borderColor = '')}
									oninput={async (e) => {
										// Remove any non-numeric characters
										const target = e.currentTarget;
										const value = target.value.replace(/[^0-9]/g, '');
										if (value !== target.value) {
											verificationCode = value;
										}

										// Auto-verify when 6 digits are entered
										if (verificationCode.length === 6) {
											await verifyCode(true);
										} else {
											isVerified = false;
											verificationError = '';
										}
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter' && canProceedVerification()) {
											verifyCode();
										}
									}}
								/>
								{#if isVerified}
									<span class="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
										<svg
											class="h-5 w-5 text-white"
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
									</span>
								{:else if verificationTimer > 0}
									<span class="text-sm" style="color: {colors.primary}">
										{formatTimer(verificationTimer)}
									</span>
								{/if}
							</div>
							{#if verificationError}
								<p class="mt-2 text-sm text-red-600">{verificationError}</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Phone Step (Shows at top when active, moves down when verification shows) -->
				{#if showPhoneStep && nameCompleted && !phoneCompleted}
					<div class="rounded-lg bg-white p-6 shadow-sm">
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
									inputmode="numeric"
									pattern="[0-9]*"
									disabled={isVerificationSent}
									class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-1 focus:outline-none disabled:bg-gray-50"
									style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
									onfocus={(e) => (e.target.style.borderColor = colors.primary)}
									onblur={(e) => (e.target.style.borderColor = '')}
									oninput={(e) => {
										// Remove any non-numeric characters
										const target = e.currentTarget;
										const value = target.value.replace(/[^0-9]/g, '');
										if (value !== target.value) {
											formData.phone = value;
										}
									}}
									onkeydown={(e) => {
										if (
											e.key === 'Enter' &&
											canProceedPhone() &&
											!isVerificationSent &&
											!isSendingCode
										) {
											sendVerificationCode();
										}
									}}
								/>
								{#if !isVerificationSent}
									<button
										onclick={sendVerificationCode}
										disabled={isSendingCode || !canProceedPhone()}
										class="rounded-lg px-3 py-3 text-xs font-medium whitespace-nowrap text-white transition-colors disabled:opacity-50"
										style="background-color: {isSendingCode || !canProceedPhone()
											? '#CBD5E1'
											: colors.primary}"
									>
										{isSendingCode ? '전송중...' : '인증번호'}
									</button>
								{:else}
									<button
										onclick={editPhone}
										class="rounded-lg px-4 py-3 text-sm font-medium transition-colors"
										style="background-color: #f3f4f6; color: #6b7280;"
									>
										재전송
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- Name Step (Always visible, at top initially, moves down as new steps appear) -->
				{#if !nameCompleted}
					<div class="rounded-lg bg-white p-6 shadow-sm">
						<div>
							<label for="name" class="mb-2 block text-sm font-medium text-gray-700">
								이름을 입력해주세요
							</label>
							<div class="flex gap-2">
								<input
									id="name"
									type="text"
									bind:value={formData.name}
									placeholder="홍길동"
									class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-3 text-base focus:ring-1 focus:outline-none"
									style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
									onfocus={(e) => (e.target.style.borderColor = colors.primary)}
									onblur={(e) => (e.target.style.borderColor = '')}
									onkeydown={(e) => {
										if (e.key === 'Enter' && canProceedName()) {
											handleNameComplete();
										}
									}}
								/>
								<button
									onclick={handleNameComplete}
									disabled={!canProceedName()}
									class="rounded-lg px-3 py-3 text-xs font-medium whitespace-nowrap text-white transition-colors disabled:opacity-50"
									style="background-color: {canProceedName() ? colors.primary : '#CBD5E1'}"
								>
									확인
								</button>
							</div>
						</div>
					</div>
				{/if}

				<!-- Completed Steps (Shows at bottom) -->
				{#if nameCompleted && showPhoneStep}
					<div class="rounded-lg bg-white p-6 opacity-75 shadow-sm">
						<div>
							<label for="traveler-name" class="mb-2 block text-sm font-medium text-gray-700"> 이름 </label>
							<div class="flex gap-2">
								<input
									id="traveler-name"
									type="text"
									value={formData.name}
									disabled
									class="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-base"
								/>
								<button
									onclick={editName}
									class="rounded-lg px-4 py-3 text-sm font-medium transition-colors"
									style="background-color: #f3f4f6; color: #6b7280;"
								>
									수정
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Action Button -->
			{#if showVerificationStep && !phoneCompleted}
				<button
					onclick={() => verifyCode(false)}
					disabled={!canProceedVerification() || isLoading}
					class="mt-6 w-full rounded-lg py-4 text-base font-medium text-white transition-colors disabled:opacity-50"
					style="background-color: {canProceedVerification() && !isLoading
						? colors.primary
						: '#CBD5E1'}"
				>
					{isLoading ? '확인중...' : '다음'}
				</button>
			{/if}
		</div>
	</div>
</div>

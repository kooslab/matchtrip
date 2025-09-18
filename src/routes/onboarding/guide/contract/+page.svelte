<script lang="ts">
	import { goto, invalidateAll, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import ContractViewer from '$lib/components/ContractViewer.svelte';
	import { CONTRACT_VERSION } from '$lib/constants/contractTerms';
	import iconArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';
	
	// Use afterNavigate for more reliable scroll reset
	afterNavigate(() => {
		window.scrollTo(0, 0);
	});

	// Get data from store
	let storeData = onboardingStore.get();

	// Contract agreement state
	let contractState = $state({
		scrollProgress: 0,
		hasScrolledToBottom: false,
		isAgreed: false,
		agreedAt: null as Date | null
	});

	// Contract form data  
	let contractFormData = $state({
		name: storeData.name || '',
		address: '',
		businessRegistrationNumber: '',
		birthDate: storeData.birthDate || ''
	});

	// Get today's date formatted as YYYY년 MM월 DD일
	const today = new Date();
	const contractDate = `${today.getFullYear()}년 ${(today.getMonth() + 1).toString().padStart(2, '0')}월 ${today.getDate().toString().padStart(2, '0')}일`;

	let isLoading = $state(false);
	let isRedirecting = $state(false);

	onMount(() => {
		// Scroll to top when page loads - use multiple methods to ensure it works
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		document.body.scrollTop = 0;
		
		// Also try with a small delay to ensure DOM is ready
		setTimeout(() => {
			window.scrollTo(0, 0);
		}, 0);
		
		// Check if required data exists
		if (
			!storeData.name ||
			!storeData.phone ||
			!storeData.nickname ||
			!storeData.destinations?.length
		) {
			goto('/onboarding/guide');
		}
	});

	// Handle scroll completion
	function handleScrollComplete() {
		contractState.hasScrolledToBottom = true;
	}

	// Handle progress update
	function handleProgressUpdate(progress: number) {
		contractState.scrollProgress = progress;
	}

	// Handle checkbox change
	function handleAgreementChange(event: Event) {
		const checkbox = event.target as HTMLInputElement;
		contractState.isAgreed = checkbox.checked;
		if (checkbox.checked) {
			contractState.agreedAt = new Date();
		} else {
			contractState.agreedAt = null;
		}
	}

	// Handle back navigation
	function handleBack() {
		goto('/onboarding/guide/documents', { replaceState: false, noScroll: false });
	}

	// Handle next - complete profile with contract agreement
	async function handleNext() {
		if (!contractState.isAgreed || !contractState.agreedAt) {
			alert('계약서에 동의해주세요.');
			return;
		}

		// Validate required contract fields
		if (!contractFormData.name.trim()) {
			alert('이름을 입력해주세요.');
			return;
		}
		if (!contractFormData.address.trim()) {
			alert('주소를 입력해주세요.');
			return;
		}

		isLoading = true;
		const startTime = Date.now();
		console.log('[CONTRACT AGREEMENT] Starting profile completion at', new Date().toISOString());

		try {
			// Create FormData for profile creation
			const profileData = new FormData();
			profileData.append('name', storeData.name);
			profileData.append('phone', storeData.phone);
			profileData.append('nickname', storeData.nickname);
			profileData.append('frequentArea', storeData.frequentArea);
			profileData.append('birthDate', storeData.birthDate);
			profileData.append('bio', storeData.bio || '');
			profileData.append('destinations', JSON.stringify(storeData.destinations));
			profileData.append('contractAgreedAt', contractState.agreedAt.toISOString());
			profileData.append('contractVersion', CONTRACT_VERSION);
			profileData.append('contractScrollCompleted', 'true');
			profileData.append('contractAddress', contractFormData.address);
			profileData.append('businessRegistrationNumber', contractFormData.businessRegistrationNumber);

			if (storeData.profileImageUrl) {
				profileData.append('profileImageUrl', storeData.profileImageUrl);
			}

			// Add certification files by category if they exist
			if (storeData.uploadedFiles) {
				Object.entries(storeData.uploadedFiles).forEach(([categoryId, files]) => {
					(files as File[]).forEach((file) => {
						profileData.append(`documents_${categoryId}`, file);
					});
				});
			}

			// Set user role to guide
			console.log('[CONTRACT AGREEMENT] Setting user role to guide');
			const roleResponse = await fetch('/api/user/role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'guide' })
			});

			if (!roleResponse.ok) {
				console.error('[CONTRACT AGREEMENT] Failed to set user role:', await roleResponse.text());
			} else {
				console.log('[CONTRACT AGREEMENT] User role set to guide successfully');
			}

			// Update user profile data
			console.log('[CONTRACT AGREEMENT] Updating user profile');
			const userResponse = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: storeData.name,
					phone: storeData.phone,
					birthDate: storeData.birthDate
				})
			});

			if (!userResponse.ok) {
				const error = await userResponse.json();
				console.error('[CONTRACT AGREEMENT] Failed to update user profile:', error);
				alert(error.error || '프로필 저장에 실패했습니다.');
				return;
			}
			console.log('[CONTRACT AGREEMENT] User profile updated successfully');

			// Create guide profile with contract agreement
			console.log('[CONTRACT AGREEMENT] Creating guide profile with contract agreement');
			const guideResponse = await fetch('/api/profile/guide', {
				method: 'POST',
				body: profileData
			});

			console.log('[CONTRACT AGREEMENT] Guide profile API response:', {
				status: guideResponse.status,
				statusText: guideResponse.statusText
			});

			if (guideResponse.ok) {
				const guideResult = await guideResponse.json();
				console.log('[CONTRACT AGREEMENT] Guide profile created successfully:', guideResult);

				// Mark onboarding as completed
				console.log('[CONTRACT AGREEMENT] Marking onboarding as completed');
				const completeResponse = await fetch('/api/user/complete-onboarding', {
					method: 'POST'
				});

				if (!completeResponse.ok) {
					console.error(
						'[CONTRACT AGREEMENT] Failed to mark onboarding as complete:',
						await completeResponse.text()
					);
				} else {
					const result = await completeResponse.json();
					console.log('[CONTRACT AGREEMENT] Onboarding marked as completed:', result);
				}

				// Invalidate all cached data
				console.log('[CONTRACT AGREEMENT] Invalidating all cached data');
				await invalidateAll();

				// Clear store
				console.log('[CONTRACT AGREEMENT] Clearing store');
				onboardingStore.reset();

				// Navigate to completion page
				console.log('[CONTRACT AGREEMENT] Total time:', Date.now() - startTime + 'ms');
				console.log('[CONTRACT AGREEMENT] Navigating to completion page');
				isRedirecting = true;
				window.location.href = '/onboarding/guide/complete';
			} else {
				const error = await guideResponse.json();
				console.error('[CONTRACT AGREEMENT] Failed to create guide profile:', error);
				alert(error.error || '프로필 생성에 실패했습니다.');
			}
		} catch (error) {
			console.error('[CONTRACT AGREEMENT] Error:', error);
			alert('오류가 발생했습니다. 다시 시도해주세요.');
		} finally {
			isLoading = false;
			isRedirecting = false;
		}
	}

	// Handle skip
	async function handleSkip() {
		// Store contract as not agreed for now
		onboardingStore.setData({ contractAgreed: false });

		// Navigate to documents page for now (without contract)
		// This is temporary - in production, we should not allow skip
		goto('/onboarding/guide/documents', { replaceState: false, noScroll: false });
	}

	// Handle Enter key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && contractState.isAgreed && !isLoading) {
			event.preventDefault();
			handleNext();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-white">
	<div class="mx-auto max-w-md">
		<!-- Header -->
		<header class="sticky top-0 z-20 bg-white border-b border-gray-200">
			<div class="flex h-14 items-center px-4">
				<button onclick={handleBack} class="mr-4" disabled={isLoading}>
					<img src={iconArrowBack} alt="뒤로가기" class="h-6 w-6" />
				</button>
				<h1 class="text-lg font-semibold">수수료 지급 계약서</h1>
			</div>
		</header>

		<!-- Content -->
		<div class="pb-32">
			<!-- Contract Notice -->
			<div class="px-4 py-4 bg-blue-50 border-b border-blue-200">
				<p class="text-sm text-blue-800">
					<strong>안내:</strong> 가이드 활동을 위해서는 아래 계약서의 모든 내용을 읽고 동의하셔야 합니다.
					계약서를 끝까지 읽으신 후 동의 체크박스가 활성화됩니다.
				</p>
			</div>

			<!-- Contract Info Section -->
			<div class="px-4 py-6 bg-gray-50 border-b border-gray-200">
				<h2 class="text-lg font-semibold mb-4">계약 정보</h2>
				
				<!-- Contract Date -->
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-1">계약 일자</label>
					<div class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900">
						{contractDate}
					</div>
				</div>

				<!-- Name Field -->
				<div class="mb-4">
					<label for="contract-name" class="block text-sm font-medium text-gray-700 mb-1">
						이름 (갑)
					</label>
					<input
						id="contract-name"
						type="text"
						bind:value={contractFormData.name}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
						placeholder="이름"
						readonly
					/>
				</div>

				<!-- Birth Date Field -->
				<div class="mb-4">
					<label for="contract-birthdate" class="block text-sm font-medium text-gray-700 mb-1">
						생년월일
					</label>
					<input
						id="contract-birthdate"
						type="text"
						bind:value={contractFormData.birthDate}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
						placeholder="YYYY-MM-DD"
						readonly
					/>
				</div>

				<!-- Address Field -->
				<div class="mb-4">
					<label for="contract-address" class="block text-sm font-medium text-gray-700 mb-1">
						주소 <span class="text-red-500">*</span>
					</label>
					<input
						id="contract-address"
						type="text"
						bind:value={contractFormData.address}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="주소를 입력하세요"
					/>
				</div>

				<!-- Business Registration Number -->
				<div class="mb-2">
					<label for="contract-business" class="block text-sm font-medium text-gray-700 mb-1">
						사업자 등록 번호 (선택)
					</label>
					<input
						id="contract-business"
						type="text"
						bind:value={contractFormData.businessRegistrationNumber}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="사업자 등록 번호 (해당 시)"
					/>
				</div>
			</div>

			<!-- Contract Viewer -->
			<div class="px-4 py-4">
				<ContractViewer
					onScrollComplete={handleScrollComplete}
					onProgressUpdate={handleProgressUpdate}
					userName={contractFormData.name}
					userBirthDate={contractFormData.birthDate}
					userAddress={contractFormData.address}
					contractDate={contractDate}
				/>
			</div>

			<!-- Agreement Section -->
			<div class="px-4 py-6">
				<div class="bg-gray-50 rounded-lg p-4">
					<label class="flex items-start cursor-pointer">
						<input
							type="checkbox"
							checked={contractState.isAgreed}
							onchange={handleAgreementChange}
							disabled={!contractState.hasScrolledToBottom}
							class="mt-1 mr-3 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
						/>
						<div class="flex-1">
							<p
								class="text-sm font-medium {contractState.hasScrolledToBottom
									? 'text-gray-900'
									: 'text-gray-400'}"
							>
								본 계약서의 모든 내용을 읽고 동의합니다
							</p>
							{#if !contractState.hasScrolledToBottom}
								<p class="text-xs text-gray-500 mt-1">
									계약서를 끝까지 읽으신 후 동의하실 수 있습니다. (진행률: {contractState.scrollProgress}%)
								</p>
							{/if}
							{#if contractState.agreedAt}
								<p class="text-xs text-gray-500 mt-1">
									동의 시간: {contractState.agreedAt.toLocaleString('ko-KR')}
								</p>
							{/if}
						</div>
					</label>
				</div>

				<!-- Info Box -->
			</div>
		</div>

		<!-- Bottom Button -->
		<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
			<div class="mx-auto max-w-md px-4 py-4">
				<button
					onclick={handleNext}
					disabled={!contractState.isAgreed || isLoading || isRedirecting}
					class="w-full rounded-lg py-3 text-base font-medium transition-all
					{contractState.isAgreed && !isLoading && !isRedirecting
						? 'bg-blue-500 text-white hover:bg-blue-600'
						: 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
				>
					{#if isLoading || isRedirecting}
						<span class="inline-flex items-center">
							<svg
								class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							처리중...
						</span>
					{:else}
						동의하고 가이드 등록 완료
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>
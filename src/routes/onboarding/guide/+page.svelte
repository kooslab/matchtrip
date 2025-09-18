<script lang="ts">
	import { goto } from '$app/navigation';
	import { colors } from '$lib/constants/colors';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import { countryCodesForDropdown } from '$lib/data/countryCodes';

	let { data } = $props();

	// Stack management
	type Step = 'name' | 'mobile' | 'profile' | 'destinations' | 'documents' | 'complete';
	let currentStep = $state<Step>('name');
	let completedSteps = $state<Step[]>([]);

	// Form data
	let formData = $state({
		name: '',
		countryCode: '+82',
		mobile: '',
		mobileFormatted: '',
		profileImage: '',
		frequentArea: '',
		birthDate: '',
		birthYear: '',
		birthMonth: '',
		birthDay: '',
		gender: '',
		languages: [] as string[],
		bio: '',
		destinations: [] as string[],
		certificationFiles: [] as File[]
	});


	// Available destinations
	const availableDestinations = [
		'서울',
		'부산',
		'제주도',
		'경주',
		'강릉',
		'전주',
		'인천',
		'대구',
		'광주',
		'대전',
		'울산',
		'수원',
		'춘천',
		'속초',
		'여수',
		'목포',
		'안동',
		'통영',
		'남해',
		'거제'
	];

	// Available languages
	const availableLanguages = [
		'한국어',
		'영어',
		'일본어',
		'중국어',
		'스페인어',
		'프랑스어',
		'독일어',
		'러시아어',
		'아랍어'
	];

	// Loading states
	let isLoading = $state(false);

	// Custom dropdown state (fallback if Bits UI doesn't work)
	let isDropdownOpen = $state(false);

	// Track previous step to detect actual changes
	let previousStep = $state<Step | null>(null);
	
	// Auto-scroll to top when step changes
	$effect(() => {
		// Only scroll if step actually changed (not on initial render)
		if (previousStep !== null && previousStep !== currentStep) {
			window.scrollTo({ top: 0, behavior: 'instant' });
		}
		previousStep = currentStep;
	});

	// Load data from store on mount
	onMount(() => {
		const storeData = onboardingStore.get();
		if (storeData.name) {
			formData.name = storeData.name;
			completedSteps = ['name'];
			currentStep = 'mobile';
			// Auto-focus on mobile input when starting from mobile step
			setTimeout(() => {
				const mobileInput = document.getElementById('mobile-input');
				if (mobileInput) {
					mobileInput.focus();
				}
			}, 100);
		}
		if (storeData.phone) {
			// Extract country code and mobile number
			const phone = storeData.phone;
			for (const country of countryCodesForDropdown) {
				if (phone.startsWith(country.code.replace('+', ''))) {
					formData.countryCode = country.code;
					formData.mobile = phone.substring(country.code.length - 1);
					// Format the mobile number
					handleMobileInput({ target: { value: formData.mobile } } as any);
					break;
				}
			}
			if (formData.mobile) {
				completedSteps = ['name', 'mobile'];
				// Since profile and beyond are separate pages, we don't advance further
			}
		}
	});

	// Form validation
	// IMPORTANT: Mobile validation has been intentionally made flexible (2025-08-29)
	// to accept all international phone formats without strict patterns
	function canProceed(): boolean {
		switch (currentStep) {
			case 'name':
				return formData.name.trim().length >= 2;
			case 'mobile':
				// Accept any phone number with 7-15 digits (ITU-T E.164 standard)
				// This flexible validation replaces the previous strict country-specific patterns
				// to prevent users from getting stuck with valid but differently formatted numbers
				return formData.mobile.length >= 7 && formData.mobile.length <= 15;
			case 'profile':
				return (
					formData.name.trim().length >= 2 &&
					formData.frequentArea.trim().length > 0 &&
					formData.birthDate.length > 0
				);
			case 'destinations':
				return formData.destinations.length > 0;
			case 'documents':
				return true; // Optional step
			default:
				return false;
		}
	}

	// Get minimum mobile number length - very flexible for all countries
	function getMinMobileLength(countryCode: string): number {
		// Most international mobile numbers are at least 7 digits
		// Being very permissive to accept all formats worldwide
		return 7; // Universal minimum for any country
	}

	// Format mobile number for display in completed steps - now just shows raw digits
	function getFormattedMobile(mobile: string, countryCode: string): string {
		if (!mobile) return '';
		// Simply return the raw mobile number without any formatting
		return mobile;
	}

	// Handle next step
	async function handleNext() {
		if (!canProceed()) return;

		isLoading = true;

		try {
			// Store data in onboarding store before moving to next step
			onboardingStore.setData({
				name: formData.name,
				phone: formData.countryCode + formData.mobile
			});

			completedSteps = [...completedSteps, currentStep];

			// Move to next step
			switch (currentStep) {
				case 'name':
					// Don't change step immediately - wait for loading to complete
					break;
				case 'mobile':
					// Navigate to separate profile page
					await goto('/onboarding/guide/profile', { replaceState: false, noScroll: false });
					return;
				case 'destinations':
					// Don't change step immediately - wait for loading to complete
					break;
				case 'documents':
					// Save all data
					await saveProfile();
					break;
			}
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			// Set loading to false first
			const wasLoading = isLoading;
			isLoading = false;
			
			// Only change the step after loading is complete if we were actually loading
			if (wasLoading) {
				switch (currentStep) {
					case 'name':
						currentStep = 'mobile';
						// Scroll to top
						window.scrollTo({ top: 0, behavior: 'instant' });
						// Auto-focus on mobile input after DOM update
						setTimeout(() => {
							const mobileInput = document.getElementById('mobile-input');
							if (mobileInput) {
								mobileInput.focus();
							}
						}, 100);
						break;
					case 'destinations':
						currentStep = 'documents';
						// Scroll to top
						window.scrollTo({ top: 0, behavior: 'instant' });
						break;
				}
			}
		}
	}

	// Handle back navigation
	function handleBack() {
		// If we're on the name step, go back to previous page
		if (currentStep === 'name') {
			goto(-1);
			return;
		}

		// Otherwise, go back to previous step
		switch (currentStep) {
			case 'mobile':
				currentStep = 'name';
				// Remove mobile from completed steps
				completedSteps = completedSteps.filter((s) => s !== 'name');
				// Scroll to top
				window.scrollTo({ top: 0, behavior: 'instant' });
				// Auto-focus on name input after DOM update
				setTimeout(() => {
					const nameInput = document.getElementById('name');
					if (nameInput) {
						nameInput.focus();
					}
				}, 100);
				break;
			case 'destinations':
				// This would be handled by separate page navigation
				break;
			case 'documents':
				currentStep = 'destinations';
				completedSteps = completedSteps.filter((s) => s !== 'destinations');
				// Scroll to top
				window.scrollTo({ top: 0, behavior: 'instant' });
				break;
		}
	}

	// Save profile
	async function saveProfile() {
		const birthDate = `${formData.birthYear}-${formData.birthMonth.padStart(2, '0')}-${formData.birthDay.padStart(2, '0')}`;

		// Create FormData for file upload
		const profileData = new FormData();
		profileData.append('name', formData.name);
		profileData.append('phone', formData.mobile);
		profileData.append('countryCode', formData.countryCode);
		profileData.append('birthDate', birthDate);
		profileData.append('gender', formData.gender);
		profileData.append('languages', JSON.stringify(formData.languages));
		profileData.append('bio', formData.bio);
		profileData.append('destinations', JSON.stringify(formData.destinations));

		// Add certification files
		formData.certificationFiles.forEach((file, index) => {
			profileData.append(`documents`, file);
		});

		const response = await fetch('/api/profile/guide', {
			method: 'POST',
			body: profileData
		});

		if (response.ok) {
			currentStep = 'complete';
			// Redirect after a short delay
			setTimeout(() => {
				goto('/');
			}, 2000);
		} else {
			alert('프로필 저장에 실패했습니다.');
		}
	}

	// Toggle language selection
	function toggleLanguage(language: string) {
		if (formData.languages.includes(language)) {
			formData.languages = formData.languages.filter((l) => l !== language);
		} else {
			formData.languages = [...formData.languages, language];
		}
	}

	// Toggle destination selection
	function toggleDestination(destination: string) {
		if (formData.destinations.includes(destination)) {
			formData.destinations = formData.destinations.filter((d) => d !== destination);
		} else {
			formData.destinations = [...formData.destinations, destination];
		}
	}

	// Handle mobile input - simplified version without pattern formatting
	// IMPORTANT: Pattern formatting has been intentionally removed (2025-08-29)
	// This function now only extracts digits and enforces the 15-digit maximum
	// No country-specific formatting patterns are applied
	// See CLAUDE.md for full documentation on this change
	function handleMobileInput(e: Event) {
		const input = e.target as HTMLInputElement;

		// Extract only digits from the input
		let digits = input.value.replace(/\D/g, '');

		// Remove leading zero for international format
		if (digits.startsWith('0')) {
			digits = digits.substring(1);
		}

		// Limit to maximum 15 digits (ITU-T E.164 standard)
		digits = digits.substring(0, 15);

		// Store raw digits for validation and submission
		formData.mobile = digits;
		formData.mobileFormatted = digits; // No formatting, just raw digits

		// Update the input field with raw digits (no formatting)
		input.value = digits;
	}

	// Handle file upload
	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			formData.certificationFiles = [...formData.certificationFiles, ...Array.from(input.files)];
		}
	}

	function removeFile(index: number) {
		formData.certificationFiles = formData.certificationFiles.filter((_, i) => i !== index);
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.country-dropdown')) {
			isDropdownOpen = false;
		}
	}

	// Handle Enter key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && currentStep !== 'complete') {
			// Prevent form submission if inside a form
			event.preventDefault();

			// Check if the dropdown is open - if so, don't trigger next
			if (isDropdownOpen) return;

			// Only proceed if the button would be enabled
			if (canProceed() && !isLoading) {
				handleNext();
			}
		}
	}
</script>

<svelte:window onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="min-h-screen bg-white">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white">
		<div class="flex h-14 items-center px-4">
			<button onclick={handleBack} class="mr-4">
				<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"
					></path>
				</svg>
			</button>
		</div>
		<div class="h-px bg-blue-500"></div>
	</header>

	<!-- Content -->
	<div class="pb-32 pt-6">
		<div class="mx-auto max-w-sm space-y-4 px-4">
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
							style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1; font-size: 16px; -webkit-text-size-adjust: 100%;"
							onfocus={(e) => {
								e.target.style.borderColor = colors.primary;
								// Prevent zoom on iOS
								e.target.style.fontSize = '16px';
							}}
							onblur={(e) => (e.target.style.borderColor = '')}
						/>
					</div>
				</div>
			{:else if currentStep === 'mobile' && !completedSteps.includes('mobile')}
				<div class="rounded-lg bg-white p-4 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-900">휴대폰 번호를 입력해주세요</h2>

					<div>
						<label for="mobile" class="mb-2 block text-sm font-medium text-gray-700">
							휴대폰 번호
						</label>
						<div class="flex gap-2">
							<!-- Custom Dropdown -->
							<div class="country-dropdown relative">
								<button
									type="button"
									onclick={() => (isDropdownOpen = !isDropdownOpen)}
									class="flex w-24 items-center justify-between rounded-lg border border-gray-300 bg-white px-2 py-3 text-sm hover:border-gray-400 focus:ring-1 focus:outline-none"
									style="--tw-ring-color: {colors.primary};"
								>
									<span class="text-sm"
										>{countryCodesForDropdown.find((c) => c.code === formData.countryCode)?.flag}
										{formData.countryCode}</span
									>
									<svg
										class="h-3 w-3 text-gray-500 transition-transform"
										class:rotate-180={isDropdownOpen}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										></path>
									</svg>
								</button>

								{#if isDropdownOpen}
									<div
										class="absolute top-full right-0 left-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg"
									>
										{#each countryCodesForDropdown as country}
											<button
												type="button"
												onclick={() => {
													formData.countryCode = country.code;
													formData.mobile = '';
													formData.mobileFormatted = '';
													isDropdownOpen = false;
												}}
												class="flex w-full cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50"
											>
												<span class="text-base">{country.flag}</span>
												<span class="font-medium text-gray-900">{country.code}</span>
											</button>
										{/each}
									</div>
								{/if}
							</div>
							<input
								id="mobile-input"
								type="tel"
								inputmode="numeric"
								pattern="[0-9]*"
								value={formData.mobileFormatted}
								maxlength="15"
								oninput={handleMobileInput}
								onkeydown={(e) => {
									// Allow special keys
									const allowedKeys = [
										'Backspace',
										'Delete',
										'Tab',
										'Escape',
										'Enter',
										'Home',
										'End',
										'ArrowLeft',
										'ArrowRight',
										'ArrowUp',
										'ArrowDown'
									];
									if (allowedKeys.includes(e.key)) return;

									// Allow Ctrl/Cmd combinations
									if (e.ctrlKey || e.metaKey) return;

									// Block if not a number
									if (!/^[0-9]$/.test(e.key)) {
										e.preventDefault();
									}
								}}
								onpaste={(e) => {
									// Handle paste events to strip non-numeric characters
									e.preventDefault();
									const paste = e.clipboardData?.getData('text') || '';
									const numbersOnly = paste.replace(/\D/g, '');

									// Manually trigger input event with cleaned data
									const input = e.target as HTMLInputElement;
									const start = input.selectionStart || 0;
									const end = input.selectionEnd || 0;
									const currentValue = formData.mobile;
									const newValue =
										currentValue.substring(0, start) + numbersOnly + currentValue.substring(end);

									// Create synthetic event
									const syntheticEvent = new Event('input', { bubbles: true });
									input.value = newValue;
									input.dispatchEvent(syntheticEvent);
								}}
								placeholder={formData.countryCode === '+82'
									? '10-1234-5678'
									: formData.countryCode === '+1'
										? '(123) 456-7890'
										: formData.countryCode === '+81'
											? '90-1234-5678'
											: formData.countryCode === '+86'
												? '138-1234-5678'
												: formData.countryCode === '+44'
													? '71-2345-6789'
													: formData.countryCode === '+33'
														? '61-23-45-67-89'
														: formData.countryCode === '+49'
															? '151-2345-6789'
															: '1234567890'}
								class="max-w-full min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-1 focus:outline-none"
								style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1; font-size: 16px; -webkit-text-size-adjust: 100%;"
								onfocus={(e) => {
									e.target.style.borderColor = colors.primary;
									// Prevent zoom on iOS
									e.target.style.fontSize = '16px';
								}}
								onblur={(e) => (e.target.style.borderColor = '')}
							/>
						</div>
					</div>
				</div>
			{:else if currentStep === 'destinations'}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-900">
						가이드 가능한 지역을 선택해주세요
					</h2>

					<div>
						<label class="mb-3 block text-sm font-medium text-gray-700">
							주요 가이드 지역 (복수 선택 가능)
						</label>
						<div class="grid grid-cols-2 gap-3">
							{#each availableDestinations as destination}
								<button
									onclick={() => toggleDestination(destination)}
									type="button"
									class="rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all
										{formData.destinations.includes(destination)
										? 'border-blue-500 bg-blue-50 text-blue-700'
										: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}"
								>
									{destination}
								</button>
							{/each}
						</div>
						{#if formData.destinations.length > 0}
							<div class="mt-4 rounded-lg bg-gray-50 p-3">
								<p class="text-sm text-gray-600">선택된 지역:</p>
								<p class="text-sm font-medium text-gray-900">{formData.destinations.join(', ')}</p>
							</div>
						{/if}
					</div>
				</div>
			{:else if currentStep === 'documents'}
				<div class="rounded-lg bg-white p-6 shadow-sm">
					<h2 class="mb-6 text-lg font-semibold text-gray-900">자격 서류를 업로드해주세요</h2>

					<div class="space-y-6">
						<div class="space-y-2 text-sm text-gray-600">
							<p>• 신분증 (운전면허증, 주민등록증 등)</p>
							<p>• 관광통역안내사 자격증 (보유 시)</p>
							<p>• 기타 관련 자격증 (어학 인증서, 전문 분야 자격증 등)</p>
						</div>

						<div>
							<label class="mb-3 block text-sm font-medium text-gray-700">
								파일 업로드 (PDF, JPG, JPEG, PNG, DOCX, PPTX, XLSX 지원)
							</label>
							<label class="block">
								<input
									type="file"
									multiple
									accept=".pdf,.jpg,.jpeg,.png,.docx,.pptx,.xlsx"
									onchange={handleFileUpload}
									class="hidden"
								/>
								<div
									class="flex h-40 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-gray-400"
								>
									<svg
										class="mb-3 h-12 w-12 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										/>
									</svg>
									<p class="text-sm font-medium text-gray-900">파일을 클릭하여 업로드</p>
									<p class="mt-1 text-xs text-gray-500">또는 파일을 여기로 드래그하세요</p>
								</div>
							</label>

							{#if formData.certificationFiles.length > 0}
								<div class="mt-4 space-y-3">
									<p class="text-sm font-medium text-gray-700">업로드된 파일:</p>
									{#each formData.certificationFiles as file, index}
										<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
											<div class="flex items-center">
												<svg
													class="mr-3 h-5 w-5 text-gray-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
													/>
												</svg>
												<span class="truncate text-sm text-gray-700">{file.name}</span>
											</div>
											<button
												onclick={() => removeFile(index)}
												class="text-gray-400 transition-colors hover:text-red-500"
											>
												<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											</button>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<div class="rounded-lg bg-blue-50 p-4">
							<p class="text-xs text-blue-800">
								<strong>참고:</strong> 업로드된 서류는 가이드 승인 과정에서 검토됩니다. 개인정보는 안전하게
								보호되며, 승인 완료 후 즉시 삭제됩니다.
							</p>
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
					<h2 class="mb-2 text-xl font-bold text-gray-900">가이드 프로필 설정 완료!</h2>
					<p class="text-gray-600">잠시 후 홈 화면으로 이동합니다.</p>
				</div>
			{/if}

			<!-- Completed Steps Stack (below current step) -->
			{#each completedSteps as step}
				<button
					class="w-full cursor-pointer rounded-lg bg-white p-4 text-left shadow-sm transition-all hover:shadow-md"
					onclick={() => {
						// Allow editing completed steps
						currentStep = step;
						// Remove this step and all steps after it from completed
						const stepIndex = ['name', 'mobile', 'profile', 'destinations', 'documents'].indexOf(
							step
						);
						completedSteps = completedSteps.filter((s) => {
							const sIndex = ['name', 'mobile', 'profile', 'destinations', 'documents'].indexOf(s);
							return sIndex < stepIndex;
						});
						// Scroll to top
						window.scrollTo({ top: 0, behavior: 'instant' });
					}}
				>
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
					{:else if step === 'mobile'}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs text-gray-500">휴대폰 번호</p>
								<p class="font-medium text-gray-900">
									{formData.countryCode}
									{formData.mobileFormatted}
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
					{:else if step === 'profile'}
						<div class="flex items-center justify-between">
							<div class="mr-3 flex-1">
								<p class="text-xs text-gray-500">기본 프로필</p>
								<p class="text-sm font-medium text-gray-900">
									{formData.birthYear}년 {formData.birthMonth}월 {formData.birthDay}일 •
									{formData.gender === 'male' ? '남성' : '여성'} •
									{formData.languages.join(', ')}
								</p>
								<p class="mt-1 line-clamp-1 text-sm text-gray-600">{formData.bio}</p>
							</div>
							<svg
								class="h-5 w-5 flex-shrink-0 text-green-500"
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
					{:else if step === 'destinations'}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs text-gray-500">가이드 지역</p>
								<p class="font-medium text-gray-900">{formData.destinations.join(', ')}</p>
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
					{:else if step === 'documents'}
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs text-gray-500">업로드된 서류</p>
								<p class="font-medium text-gray-900">
									{formData.certificationFiles.length > 0
										? `${formData.certificationFiles.length}개 파일`
										: '선택 사항'}
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
				</button>
			{/each}
		</div>
	</div>

	<!-- Bottom Button -->
	{#if currentStep !== 'complete'}
		<div
			class="fixed right-0 bottom-0 left-0 bg-white px-4 pt-4 pb-4 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]"
		>
			<div class="mx-auto max-w-[430px]">
				{#if currentStep === 'documents'}
					<div class="flex gap-3">
						<button
							onclick={() => handleNext()}
							class="flex-1 rounded-lg border border-gray-300 bg-white py-3.5 text-base font-medium text-gray-700"
						>
							건너뛰기
						</button>
						<button
							onclick={handleNext}
							disabled={isLoading}
							class="flex-1 rounded-lg py-3.5 text-base font-semibold text-white transition-all
								{!isLoading ? '' : 'cursor-not-allowed opacity-50'}"
							style="background-color: {!isLoading ? colors.primary : '#CBD5E1'}"
						>
							{isLoading ? '처리중...' : '완료'}
						</button>
					</div>
				{:else}
					<button
						onclick={handleNext}
						disabled={!canProceed() || isLoading}
						class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all
							{canProceed() && !isLoading ? '' : 'cursor-not-allowed opacity-50'}"
						style="background-color: {canProceed() && !isLoading ? colors.primary : '#CBD5E1'}"
					>
						{isLoading ? '처리중...' : '다음'}
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>

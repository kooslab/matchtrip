<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import PasswordInputs, { type PasswordInputsType } from '$lib/components/PasswordInputs.svelte';
	import TermsAgreement, { type TermsAgreementType } from '$lib/components/TermsAgreement.svelte';
	import { formatPhoneNumber, createPhoneInputHandler } from '$lib/utils/phoneFormatter';
	import { validateFile, getAcceptString, formatFileSize } from '$lib/utils/fileValidator';
	import { Upload, MapPin, Star, FileText, User, Shield } from 'lucide-svelte';

	// Basic info
	let email = $state('');
	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let phone = $state('');
	let birthDate = $state('');

	// Activity areas
	let destinations = $state<string[]>([]);
	let newDestination = $state('');
	let currentLocation = $state('');

	// Guide credentials
	let introduction = $state('');

	// File uploads
	let profileImage: File | null = $state(null);
	let idDocument: File | null = $state(null);
	let guideLicense: File | null = $state(null);
	let driverLicense: File | null = $state(null);
	let carInsurance: File | null = $state(null);

	// Form state
	let error = $state('');
	let fileError = $state('');
	let isLoading = $state(false);
	let currentStep = $state(1);
	let termsComponent: TermsAgreementType;
	let passwordValidationRef: PasswordInputsType;
	let passwordValidRef = $state(false);
	let termsValid = $state(false);
	let signupSuccess = $state(false);
	let userEmail = $state('');

	// Computed values for form validation
	let isBasicInfoValid = $derived(
		email &&
			email.includes('@') &&
			email.includes('.') &&
			name &&
			name.trim().length > 0 &&
			phone &&
			phone.trim().length > 0 &&
			birthDate &&
			password &&
			confirmPassword &&
			password === confirmPassword &&
			passwordValidRef
	);

	let isActivityInfoValid = $derived(
		destinations.length > 0 && currentLocation && currentLocation.trim().length > 0
	);

	let isCredentialsValid = $derived(
		introduction && introduction.trim().length > 0 && profileImage && idDocument
	);

	let isFilesValid = $derived(true);

	let isFormValid = $derived(
		isBasicInfoValid && isActivityInfoValid && isCredentialsValid && isFilesValid && termsValid
	);

	// Add event listeners for password changes
	onMount(() => {
		const handlePasswordChange = (e: CustomEvent) => {
			password = e.detail;
		};

		const handleConfirmPasswordChange = (e: CustomEvent) => {
			confirmPassword = e.detail;
		};

		document.addEventListener('passwordChange', handlePasswordChange as EventListener);
		document.addEventListener(
			'confirmPasswordChange',
			handleConfirmPasswordChange as EventListener
		);

		return () => {
			document.removeEventListener('passwordChange', handlePasswordChange as EventListener);
			document.removeEventListener(
				'confirmPasswordChange',
				handleConfirmPasswordChange as EventListener
			);
		};
	});

	function checkPasswordValidity() {
		if (passwordValidationRef) {
			passwordValidRef = passwordValidationRef.validatePassword();
		}
	}

	function checkTermsValidity() {
		if (termsComponent) {
			termsValid = termsComponent.validateTerms();
		}
	}

	// Effect to check password validity when password or confirmPassword changes
	$effect(() => {
		if (password || confirmPassword) {
			checkPasswordValidity();
		}
	});

	// Effect to check terms validity when termsComponent changes
	$effect(() => {
		if (termsComponent) {
			checkTermsValidity();
		}
	});

	function addDestination() {
		const trimmedDestination = newDestination.trim();
		if (trimmedDestination && !destinations.includes(trimmedDestination)) {
			destinations = [...destinations, trimmedDestination];
			newDestination = '';
		}
	}

	function handleDestinationInput(event: Event) {
		const target = event.target as HTMLInputElement;
		newDestination = target.value;
	}

	let isComposing = $state(false);

	function handleDestinationCompositionStart() {
		isComposing = true;
	}

	function handleDestinationCompositionEnd() {
		isComposing = false;
	}

	function handleDestinationKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !isComposing) {
			event.preventDefault();
			event.stopPropagation();
			event.stopImmediatePropagation();

			// Get the current value directly from the input
			const target = event.target as HTMLInputElement;
			const currentValue = target.value.trim();

			if (currentValue && !destinations.includes(currentValue)) {
				destinations = [...destinations, currentValue];
				newDestination = '';
				target.value = '';
			}

			return false;
		}
	}

	function removeDestination(destination: string) {
		destinations = destinations.filter((d) => d !== destination);
	}

	// Create phone input handler using the utility
	const handlePhoneInput = createPhoneInputHandler((value) => (phone = value));

	function handleFileUpload(
		event: Event,
		type: 'profile' | 'id' | 'guide' | 'driver' | 'insurance'
	) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		// Clear previous file error
		fileError = '';

		if (!files || files.length === 0) {
			return;
		}

		const file = files[0];
		const validationResult = validateFile(file);

		if (!validationResult.isValid) {
			fileError = validationResult.error || '파일 검증에 실패했습니다.';
			target.value = ''; // Clear the input
			return;
		}

		// File is valid, store it
		switch (type) {
			case 'profile':
				profileImage = file;
				break;
			case 'id':
				idDocument = file;
				break;
			case 'guide':
				guideLicense = file;
				break;
			case 'driver':
				driverLicense = file;
				break;
			case 'insurance':
				carInsurance = file;
				break;
		}
	}

	async function uploadFile(file: File, type: string): Promise<string> {
		const formData = new FormData();
		formData.append('file', file);
		formData.append('type', type);

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			throw new Error('File upload failed');
		}

		const data = await response.json();
		return data.url;
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!isFormValid) {
			error = '모든 필수 항목을 입력해주세요.';
			return;
		}

		isLoading = true;
		error = '';

		try {
			// Upload files first
			const profileImageUrl = profileImage ? await uploadFile(profileImage, 'profile') : null;
			const idDocumentUrl = idDocument ? await uploadFile(idDocument, 'id') : null;
			const guideLicenseUrl = guideLicense ? await uploadFile(guideLicense, 'guide') : null;
			const driverLicenseUrl = driverLicense ? await uploadFile(driverLicense, 'driver') : null;
			const carInsuranceUrl = carInsurance ? await uploadFile(carInsurance, 'insurance') : null;

			// Get agreement states from the terms component
			const { termsAgreed, privacyAgreed, marketingAgreed } = termsComponent.getAgreementState();

			const res = await fetch('/api/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					name,
					phone,
					birthDate,
					role: 'guide',
					destinations,
					currentLocation,
					introduction,
					profileImageUrl,
					idDocumentUrl,
					guideLicenseUrl,
					driverLicenseUrl,
					carInsuranceUrl,
					termsAgreed,
					privacyAgreed,
					marketingAgreed
				})
			});

			const data = await res.json();
			if (!data.success) {
				error = data.error || '알 수 없는 오류가 발생했습니다.';
			} else {
				// Check if email verification is required
				if (data.requiresEmailVerification) {
					signupSuccess = true;
					userEmail = email;
					// Scroll to top to show success message
					window.scrollTo({ top: 0, behavior: 'smooth' });
				} else {
					// If no email verification needed, redirect to app
					window.location.href = '/app';
				}
			}
		} catch (e) {
			error = '서버 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}

	function scrollToSection(step: number) {
		currentStep = step;
		const element = document.getElementById(`step-${step}`);
		if (element) {
			element.scrollIntoView({ behavior: 'smooth' });
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 px-4 py-8">
	<!-- Header -->
	<div class="mx-auto max-w-2xl text-center">
		<img
			src="/logo.jpg"
			alt="MatchTrip Logo"
			class="mx-auto mb-6 h-32 w-auto object-contain shadow" />
		<h1 class="mb-2 text-3xl font-bold text-gray-800">가이드 회원가입</h1>
		<p class="mb-8 text-gray-600">여행 가이드로 새로운 여정을 시작하세요!</p>

		<!-- Progress indicator -->
		{#if !signupSuccess}
			<div class="mb-8 flex justify-center space-x-2">
				{#each [1, 2, 3, 4] as step}
					<div
						class="h-2 w-8 rounded-full transition-colors duration-200"
						class:bg-green-500={currentStep >= step}
						class:bg-gray-300={currentStep < step}>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Success Message -->
	{#if signupSuccess}
		<div class="mx-auto max-w-2xl">
			<div class="rounded-lg bg-green-50 border border-green-200 p-8 text-center">
				<div class="mb-4">
					<div class="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
						<svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
				</div>
				<h2 class="mb-2 text-2xl font-bold text-green-800">회원가입이 완료되었습니다!</h2>
				<p class="mb-6 text-green-700">
					이메일 인증 링크를 <strong>{userEmail}</strong>로 발송했습니다.<br />
					이메일을 확인하여 인증을 완료해 주세요.
				</p>
				<div class="space-y-3">
					<p class="text-sm text-gray-600">
						이메일이 도착하지 않았나요? 스팸 폴더를 확인해 주세요.
					</p>
					<div class="flex flex-col sm:flex-row gap-3 justify-center">
						<a
							href="/verify-email"
							class="inline-flex items-center justify-center rounded-md bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700 transition">
							이메일 인증 페이지로 이동
						</a>
						<a
							href="/signin"
							class="inline-flex items-center justify-center rounded-md bg-gray-100 px-6 py-3 text-gray-700 font-medium hover:bg-gray-200 transition">
							로그인 페이지로 이동
						</a>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<form class="mx-auto max-w-2xl space-y-12" onsubmit={handleSubmit}>
		<!-- Step 1: Basic Information -->
		<section id="step-1" class="rounded-lg bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-full bg-green-100 p-2">
					<User class="h-5 w-5 text-green-600" />
				</div>
				<h2 class="text-xl font-semibold text-gray-800">기본 정보</h2>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">이름 *</span>
					<input
						type="text"
						placeholder="이름을 입력하세요"
						class="rounded-md border border-gray-300 p-3 transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
						bind:value={name}
						disabled={isLoading}
						required />
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">이메일 *</span>
					<input
						type="email"
						placeholder="이메일을 입력하세요"
						class="rounded-md border border-gray-300 p-3 transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
						bind:value={email}
						disabled={isLoading}
						required />
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">전화번호 *</span>
					<input
						type="tel"
						placeholder="010-1234-5678"
						class="rounded-md border border-gray-300 p-3 transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
						bind:value={phone}
						oninput={handlePhoneInput}
						maxlength="13"
						disabled={isLoading}
						required />
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">생년월일 *</span>
					<input
						type="date"
						class="rounded-md border border-gray-300 p-3 transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
						bind:value={birthDate}
						disabled={isLoading}
						required />
				</label>
			</div>

			<div class="mt-4">
				<PasswordInputs
					{password}
					{confirmPassword}
					{isLoading}
					bind:this={passwordValidationRef} />
			</div>

			<div class="mt-6 flex justify-end">
				<Button
					type="button"
					onclick={() => scrollToSection(2)}
					disabled={!isBasicInfoValid}
					class="bg-green-500 hover:bg-green-600">
					다음 단계
				</Button>
			</div>
		</section>

		<!-- Step 2: Activity Areas -->
		<section id="step-2" class="rounded-lg bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-full bg-green-100 p-2">
					<MapPin class="h-5 w-5 text-green-600" />
				</div>
				<h2 class="text-xl font-semibold text-gray-800">활동 지역</h2>
			</div>

			<div class="space-y-6">
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">현재 거주중*</span>
					<input
						type="text"
						placeholder="현재 거주 지역을 입력하세요"
						class="rounded-md border border-gray-300 p-3 transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
						bind:value={currentLocation}
						disabled={isLoading}
						required />
				</label>

				<!-- Destinations -->
				<div>
					<span class="mb-3 block text-sm font-medium text-gray-700">가이드 가능 지역 *</span>
					<div class="mb-3 flex gap-2">
						<input
							type="text"
							placeholder="지역명을 입력하세요"
							class="flex-1 rounded-md border border-gray-300 p-3 transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
							value={newDestination}
							oninput={handleDestinationInput}
							onkeydown={handleDestinationKeydown}
							oncompositionstart={handleDestinationCompositionStart}
							oncompositionend={handleDestinationCompositionEnd}
							disabled={isLoading} />
						<Button
							type="button"
							onclick={addDestination}
							disabled={!newDestination.trim() || isLoading}
							class="bg-green-500 hover:bg-green-600">
							추가
						</Button>
					</div>
					{#if destinations.length > 0}
						<div class="flex flex-wrap gap-2">
							{#each destinations as destination}
								<div class="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1 text-sm">
									<span>{destination}</span>
									<button
										type="button"
										onclick={() => removeDestination(destination)}
										disabled={isLoading}
										class="text-red-500 hover:text-red-700">
										삭제
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Guide License Upload -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">가이드 자격증</label>
					<div class="flex items-center gap-4">
						<input
							type="file"
							accept={getAcceptString()}
							class="hidden"
							id="guide-license-upload"
							onchange={(e) => handleFileUpload(e, 'guide')}
							disabled={isLoading} />
						<label
							for="guide-license-upload"
							class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
							<Upload class="h-4 w-4" />
							파일 선택
						</label>
						{#if guideLicense}
							<span class="text-sm text-green-600">✓ {guideLicense.name}</span>
						{/if}
					</div>
				</div>

				<!-- Driver License Upload -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"
						>현지 운전면허증 (차량가이드)</label>
					<div class="flex items-center gap-4">
						<input
							type="file"
							accept={getAcceptString()}
							class="hidden"
							id="driver-license-upload"
							onchange={(e) => handleFileUpload(e, 'driver')}
							disabled={isLoading} />
						<label
							for="driver-license-upload"
							class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
							<Upload class="h-4 w-4" />
							파일 선택
						</label>
						{#if driverLicense}
							<span class="text-sm text-green-600">✓ {driverLicense.name}</span>
						{/if}
					</div>
				</div>

				<!-- Car Insurance Upload -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">차량보험</label>
					<div class="flex items-center gap-4">
						<input
							type="file"
							accept={getAcceptString()}
							class="hidden"
							id="car-insurance-upload"
							onchange={(e) => handleFileUpload(e, 'insurance')}
							disabled={isLoading} />
						<label
							for="car-insurance-upload"
							class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
							<Upload class="h-4 w-4" />
							파일 선택
						</label>
						{#if carInsurance}
							<span class="text-sm text-green-600">✓ {carInsurance.name}</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="mt-6 flex justify-between">
				<Button
					type="button"
					onclick={() => scrollToSection(1)}
					class="bg-gray-500 hover:bg-gray-600">
					이전
				</Button>
				<Button
					type="button"
					onclick={() => scrollToSection(3)}
					disabled={!isActivityInfoValid}
					class="bg-green-500 hover:bg-green-600">
					다음 단계
				</Button>
			</div>
		</section>

		<!-- Step 3: Guide Introduction -->
		<section id="step-3" class="rounded-lg bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-full bg-green-100 p-2">
					<Star class="h-5 w-5 text-green-600" />
				</div>
				<h2 class="text-xl font-semibold text-gray-800">가이드 소개</h2>
			</div>

			<div class="space-y-6">
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">자기소개 *</span>
					<textarea
						placeholder="여행자들에게 자신을 소개해주세요"
						class="h-32 rounded-md border border-gray-300 p-3 transition focus:border-green-400 focus:ring-2 focus:ring-green-100"
						bind:value={introduction}
						disabled={isLoading}
						required></textarea>
				</label>

				<!-- Profile Image -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">프로필 사진 *</label>
					<p class="mb-2 text-xs text-gray-500">JPG, PNG, WebP 형식, 최대 5MB</p>
					<div class="flex items-center gap-4">
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
							class="hidden"
							id="profile-upload"
							onchange={(e) => handleFileUpload(e, 'profile')}
							disabled={isLoading} />
						<label
							for="profile-upload"
							class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
							<Upload class="h-4 w-4" />
							사진 선택
						</label>
						{#if profileImage}
							<span class="text-sm text-green-600"
								>✓ {profileImage.name} ({formatFileSize(profileImage.size)})</span>
						{/if}
					</div>
				</div>

				<!-- ID Document -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">신분증 또는 여권 *</label>
					<p class="mb-2 text-xs text-gray-500">JPG, PNG, WebP, PDF 형식, 최대 10MB</p>
					<div class="flex items-center gap-4">
						<input
							type="file"
							accept={getAcceptString()}
							class="hidden"
							id="id-upload"
							onchange={(e) => handleFileUpload(e, 'id')}
							disabled={isLoading} />
						<label
							for="id-upload"
							class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
							<FileText class="h-4 w-4" />
							파일 선택
						</label>
						{#if idDocument}
							<span class="text-sm text-green-600"
								>✓ {idDocument.name} ({formatFileSize(idDocument.size)})</span>
						{/if}
					</div>
				</div>
			</div>

			<div class="mt-6 flex justify-between">
				<Button
					type="button"
					onclick={() => scrollToSection(2)}
					class="bg-gray-500 hover:bg-gray-600">
					이전
				</Button>
				<Button
					type="button"
					onclick={() => scrollToSection(4)}
					disabled={!isCredentialsValid}
					class="bg-green-500 hover:bg-green-600">
					다음 단계
				</Button>
			</div>
		</section>

		<!-- Step 4: Terms Agreement -->
		<section id="step-4" class="rounded-lg bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-full bg-green-100 p-2">
					<Shield class="h-5 w-5 text-green-600" />
				</div>
				<h2 class="text-xl font-semibold text-gray-800">약관 동의</h2>
			</div>

			<TermsAgreement bind:this={termsComponent} {isLoading} on:change={checkTermsValidity} />

			<div class="mt-6 flex justify-between">
				<Button
					type="button"
					onclick={() => scrollToSection(3)}
					class="bg-gray-500 hover:bg-gray-600">
					이전
				</Button>
				<Button
					type="submit"
					loading={isLoading}
					loadingText="회원가입 중..."
					class="bg-green-500 hover:bg-green-600"
					disabled={!isFormValid || isLoading}>
					가이드 회원가입 완료
				</Button>
			</div>
		</section>

		{#if error}
			<div class="rounded-md bg-red-50 p-4 text-center">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}

		{#if fileError}
			<div class="rounded-md bg-red-50 p-4 text-center">
				<p class="text-sm text-red-600">{fileError}</p>
			</div>
		{/if}
	</form>

	<div class="mt-8 text-center">
		<p class="text-sm text-gray-500">
			이미 계정이 있으신가요?
			<a href="/signin" class="ml-1 text-green-500 hover:underline">로그인</a>
		</p>
	</div>
	{/if}
</div>

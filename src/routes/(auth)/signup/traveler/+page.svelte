<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import PasswordInputs, { type PasswordInputsType } from '$lib/components/PasswordInputs.svelte';
	import TermsAgreement, { type TermsAgreementType } from '$lib/components/TermsAgreement.svelte';
	import { formatPhoneNumber, createPhoneInputHandler } from '$lib/utils/phoneFormatter';
	import { User, MapPin, Heart, Shield, Upload } from 'lucide-svelte';

	// Basic info
	let email = $state('');
	let name = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let phone = $state('');
	let birthDate = $state('');
	let nationality = $state('');

	// Travel preferences
	let travelStyle = $state('');
	let budgetRange = $state('');
	let preferredLanguages = $state<string[]>([]);
	let travelFrequency = $state('');

	// Interests and preferences
	let interests = $state<string[]>([]);
	let dietaryRestrictions = $state<string[]>([]);
	let accessibilityNeeds = $state('');
	let emergencyContact = $state('');
	let emergencyPhone = $state('');

	// File upload
	let profileImage: File | null = $state(null);

	// Form state
	let error = $state('');
	let isLoading = $state(false);
	let currentStep = $state(1);
	let termsComponent: TermsAgreementType;
	let passwordValidationRef: PasswordInputsType;
	let passwordValidRef = $state(false);
	let termsValid = $state(false);
	let signupSuccess = $state(false);
	let userEmail = $state('');

	const travelStyleOptions = [
		'모험적인 여행',
		'문화 체험',
		'휴양 및 힐링',
		'음식 탐방',
		'역사 탐방',
		'자연 탐험',
		'도시 탐방',
		'쇼핑 여행'
	];

	const budgetOptions = ['50만원 미만', '50-100만원', '100-200만원', '200-500만원', '500만원 이상'];

	const languageOptions = [
		'한국어',
		'영어',
		'중국어',
		'일본어',
		'스페인어',
		'프랑스어',
		'독일어',
		'기타'
	];

	const frequencyOptions = ['년 1-2회', '년 3-4회', '년 5회 이상', '첫 해외여행'];

	const interestOptions = [
		'역사/문화',
		'음식/요리',
		'자연/아웃도어',
		'예술/박물관',
		'쇼핑',
		'나이트라이프',
		'스포츠',
		'사진촬영',
		'현지인과의 교류',
		'축제/이벤트'
	];

	const dietaryOptions = [
		'없음',
		'채식주의',
		'비건',
		'할랄',
		'글루텐 프리',
		'견과류 알레르기',
		'기타'
	];

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
			nationality &&
			nationality.trim().length > 0 &&
			password &&
			confirmPassword &&
			password === confirmPassword &&
			passwordValidRef
	);

	let isTravelPrefsValid = $derived(
		travelStyle &&
			travelStyle.trim().length > 0 &&
			budgetRange &&
			budgetRange.trim().length > 0 &&
			preferredLanguages.length > 0 &&
			travelFrequency &&
			travelFrequency.trim().length > 0
	);

	let isInterestsValid = $derived(
		interests.length > 0 &&
			dietaryRestrictions.length > 0 &&
			emergencyContact &&
			emergencyContact.trim().length > 0 &&
			emergencyPhone &&
			emergencyPhone.trim().length > 0
	);

	let isFormValid = $derived(
		isBasicInfoValid && isTravelPrefsValid && isInterestsValid && termsValid
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

	function toggleLanguage(language: string) {
		if (preferredLanguages.includes(language)) {
			preferredLanguages = preferredLanguages.filter((l) => l !== language);
		} else {
			preferredLanguages = [...preferredLanguages, language];
		}
	}

	function toggleInterest(interest: string) {
		if (interests.includes(interest)) {
			interests = interests.filter((i) => i !== interest);
		} else {
			interests = [...interests, interest];
		}
	}

	function toggleDietary(dietary: string) {
		if (dietaryRestrictions.includes(dietary)) {
			dietaryRestrictions = dietaryRestrictions.filter((d) => d !== dietary);
		} else {
			dietaryRestrictions = [...dietaryRestrictions, dietary];
		}
	}

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;

		if (files && files.length > 0) {
			profileImage = files[0];
		}
	}

	// Create phone input handlers using the utility
	const handlePhoneInput = createPhoneInputHandler((value) => (phone = value));
	const handleEmergencyPhoneInput = createPhoneInputHandler((value) => (emergencyPhone = value));

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
			// Upload profile image if provided
			const profileImageUrl = profileImage ? await uploadFile(profileImage, 'profile') : null;

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
					nationality,
					role: 'traveler',
					travelStyle,
					budgetRange,
					preferredLanguages,
					travelFrequency,
					interests,
					dietaryRestrictions,
					accessibilityNeeds,
					emergencyContact,
					emergencyPhone,
					profileImageUrl,
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

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 px-4 py-8">
	<!-- Header -->
	<div class="mx-auto max-w-2xl text-center">
		<img
			src="/logo.jpg"
			alt="MatchTrip Logo"
			class="mx-auto mb-6 h-32 w-auto object-contain shadow" />
		<h1 class="mb-2 text-3xl font-bold text-gray-800">여행자 회원가입</h1>
		<p class="mb-8 text-gray-600">새로운 여행의 시작을 함께해요!</p>

		<!-- Progress indicator -->
		{#if !signupSuccess}
			<div class="mb-8 flex justify-center space-x-2">
				{#each [1, 2, 3, 4] as step}
					<div
						class="h-2 w-8 rounded-full transition-colors duration-200"
						class:bg-blue-500={currentStep >= step}
						class:bg-gray-300={currentStep < step}>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Success Message -->
	{#if signupSuccess}
		<div class="mx-auto max-w-2xl">
			<div class="rounded-lg bg-blue-50 border border-blue-200 p-8 text-center">
				<div class="mb-4">
					<div class="mx-auto h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
						<svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
						</svg>
					</div>
				</div>
				<h2 class="mb-2 text-2xl font-bold text-blue-800">회원가입이 완료되었습니다!</h2>
				<p class="mb-6 text-blue-700">
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
							class="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition">
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
				<div class="rounded-full bg-blue-100 p-2">
					<User class="h-5 w-5 text-blue-600" />
				</div>
				<h2 class="text-xl font-semibold text-gray-800">기본 정보</h2>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">이름 *</span>
					<input
						type="text"
						placeholder="이름을 입력하세요"
						class="rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						bind:value={name}
						disabled={isLoading}
						required />
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">이메일 *</span>
					<input
						type="email"
						placeholder="이메일을 입력하세요"
						class="rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						bind:value={email}
						disabled={isLoading}
						required />
				</label>

				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">전화번호 *</span>
					<input
						type="tel"
						placeholder="010-1234-5678"
						class="rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
						class="rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						bind:value={birthDate}
						disabled={isLoading}
						required />
				</label>

				<label class="flex flex-col gap-1 md:col-span-2">
					<span class="text-sm font-medium text-gray-700">국적 *</span>
					<input
						type="text"
						placeholder="국적을 입력하세요"
						class="rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						bind:value={nationality}
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

			<!-- Profile Image Upload -->
			<div class="mt-4">
				<label class="mb-2 block text-sm font-medium text-gray-700">프로필 사진 (선택)</label>
				<div class="flex items-center gap-4">
					<input
						type="file"
						accept="image/*"
						class="hidden"
						id="profile-upload"
						onchange={handleFileUpload}
						disabled={isLoading} />
					<label
						for="profile-upload"
						class="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
						<Upload class="h-4 w-4" />
						사진 선택
					</label>
					{#if profileImage}
						<span class="text-sm text-blue-600">✓ {profileImage.name}</span>
					{/if}
				</div>
			</div>

			<div class="mt-6 flex justify-end">
				<Button
					type="button"
					onclick={() => scrollToSection(2)}
					disabled={!isBasicInfoValid}
					class="bg-blue-500 hover:bg-blue-600">
					다음 단계
				</Button>
			</div>
		</section>

		<!-- Step 2: Travel Preferences -->
		<section id="step-2" class="rounded-lg bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-full bg-blue-100 p-2">
					<MapPin class="h-5 w-5 text-blue-600" />
				</div>
				<h2 class="text-xl font-semibold text-gray-800">여행 선호도</h2>
			</div>

			<div class="space-y-6">
				<div>
					<label class="mb-3 block text-sm font-medium text-gray-700">선호하는 여행 스타일 *</label>
					<div class="grid gap-2 md:grid-cols-2">
						{#each travelStyleOptions as style}
							<label
								class="flex items-center gap-2 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50">
								<input
									type="radio"
									name="travelStyle"
									value={style}
									class="border-gray-300 text-blue-600 focus:ring-blue-500"
									bind:group={travelStyle}
									disabled={isLoading} />
								<span class="text-sm text-gray-700">{style}</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<label class="mb-3 block text-sm font-medium text-gray-700">여행 예산 범위 *</label>
					<div class="grid gap-2 md:grid-cols-3">
						{#each budgetOptions as budget}
							<label
								class="flex items-center gap-2 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50">
								<input
									type="radio"
									name="budgetRange"
									value={budget}
									class="border-gray-300 text-blue-600 focus:ring-blue-500"
									bind:group={budgetRange}
									disabled={isLoading} />
								<span class="text-sm text-gray-700">{budget}</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<label class="mb-3 block text-sm font-medium text-gray-700">선호 언어 *</label>
					<div class="grid gap-2 md:grid-cols-3">
						{#each languageOptions as language}
							<label
								class="flex items-center gap-2 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50">
								<input
									type="checkbox"
									class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									checked={preferredLanguages.includes(language)}
									onchange={() => toggleLanguage(language)}
									disabled={isLoading} />
								<span class="text-sm text-gray-700">{language}</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<label class="mb-3 block text-sm font-medium text-gray-700">여행 빈도 *</label>
					<div class="grid gap-2 md:grid-cols-2">
						{#each frequencyOptions as frequency}
							<label
								class="flex items-center gap-2 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50">
								<input
									type="radio"
									name="travelFrequency"
									value={frequency}
									class="border-gray-300 text-blue-600 focus:ring-blue-500"
									bind:group={travelFrequency}
									disabled={isLoading} />
								<span class="text-sm text-gray-700">{frequency}</span>
							</label>
						{/each}
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
					disabled={!isTravelPrefsValid}
					class="bg-blue-500 hover:bg-blue-600">
					다음 단계
				</Button>
			</div>
		</section>

		<!-- Step 3: Interests and Preferences -->
		<section id="step-3" class="rounded-lg bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-full bg-blue-100 p-2">
					<Heart class="h-5 w-5 text-blue-600" />
				</div>
				<h2 class="text-xl font-semibold text-gray-800">관심사 및 기타 정보</h2>
			</div>

			<div class="space-y-6">
				<div>
					<label class="mb-3 block text-sm font-medium text-gray-700">관심 있는 활동 *</label>
					<div class="grid gap-2 md:grid-cols-2">
						{#each interestOptions as interest}
							<label
								class="flex items-center gap-2 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50">
								<input
									type="checkbox"
									class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									checked={interests.includes(interest)}
									onchange={() => toggleInterest(interest)}
									disabled={isLoading} />
								<span class="text-sm text-gray-700">{interest}</span>
							</label>
						{/each}
					</div>
				</div>

				<div>
					<label class="mb-3 block text-sm font-medium text-gray-700">식이 제한사항 *</label>
					<div class="grid gap-2 md:grid-cols-3">
						{#each dietaryOptions as dietary}
							<label
								class="flex items-center gap-2 rounded-md border border-gray-200 p-3 transition hover:bg-gray-50">
								<input
									type="checkbox"
									class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
									checked={dietaryRestrictions.includes(dietary)}
									onchange={() => toggleDietary(dietary)}
									disabled={isLoading} />
								<span class="text-sm text-gray-700">{dietary}</span>
							</label>
						{/each}
					</div>
				</div>

				<label class="flex flex-col gap-1">
					<span class="text-sm font-medium text-gray-700">접근성 요구사항 (선택)</span>
					<textarea
						placeholder="특별한 도움이 필요한 사항이 있다면 입력해주세요"
						class="h-20 rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
						bind:value={accessibilityNeeds}
						disabled={isLoading}></textarea>
				</label>

				<div class="grid gap-4 md:grid-cols-2">
					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-gray-700">비상연락처 이름 *</span>
						<input
							type="text"
							placeholder="비상시 연락할 분의 이름"
							class="rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							bind:value={emergencyContact}
							disabled={isLoading}
							required />
					</label>

					<label class="flex flex-col gap-1">
						<span class="text-sm font-medium text-gray-700">비상연락처 전화번호 *</span>
						<input
							type="tel"
							placeholder="010-1234-5678"
							class="rounded-md border border-gray-300 p-3 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
							bind:value={emergencyPhone}
							oninput={handleEmergencyPhoneInput}
							maxlength="13"
							disabled={isLoading}
							required />
					</label>
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
					disabled={!isInterestsValid}
					class="bg-blue-500 hover:bg-blue-600">
					다음 단계
				</Button>
			</div>
		</section>

		<!-- Step 4: Terms Agreement -->
		<section id="step-4" class="rounded-lg bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center gap-3">
				<div class="rounded-full bg-blue-100 p-2">
					<Shield class="h-5 w-5 text-blue-600" />
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
					class="bg-blue-500 hover:bg-blue-600"
					disabled={!isFormValid || isLoading}>
					여행자 회원가입 완료
				</Button>
			</div>
		</section>

		{#if error}
			<div class="rounded-md bg-red-50 p-4 text-center">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}
	</form>

	<div class="mt-8 text-center">
		<p class="text-sm text-gray-500">
			이미 계정이 있으신가요?
			<a href="/signin" class="ml-1 text-blue-500 hover:underline">로그인</a>
		</p>
	</div>
	{/if}
</div>

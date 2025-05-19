<script lang="ts">
	import { onMount } from 'svelte';
	import Button from '$lib/components/Button.svelte';
	import PasswordInputs, { type PasswordInputsType } from '$lib/components/PasswordInputs.svelte';
	import TermsAgreement, { type TermsAgreementType } from '$lib/components/TermsAgreement.svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let termsComponent: TermsAgreementType;
	let passwordValidationRef: PasswordInputsType;
	let passwordValidRef = $state(false);
	let termsValid = $state(false);

	// Computed values for form validation
	let isEmailValid = $derived(email && email.includes('@') && email.includes('.'));
	let isFormValid = $derived(
		isEmailValid &&
			password &&
			confirmPassword &&
			password === confirmPassword &&
			passwordValidRef &&
			termsValid
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

	async function handleSubmit(event: Event) {
		event.preventDefault();
		console.log('email', email);
		console.log('password', password);
		console.log('confirmPassword', confirmPassword);

		// Double-check validation before submission
		if (!isFormValid) {
			if (password !== confirmPassword) {
				error = '비밀번호가 일치하지 않습니다.';
			} else if (!termsValid) {
				error = '필수 약관에 동의해주세요.';
			} else if (!passwordValidRef) {
				error = '비밀번호가 유효하지 않습니다.';
			} else if (!isEmailValid) {
				error = '이메일이 유효하지 않습니다.';
			} else {
				error = '모든 필수 항목을 입력해주세요.';
			}
			return;
		}

		isLoading = true;
		error = '';
		try {
			// Get agreement states from the terms component
			const { termsAgreed, privacyAgreed, marketingAgreed } = termsComponent.getAgreementState();

			const res = await fetch('/api/signup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email,
					password,
					name: email,
					role: 'traveler',
					termsAgreed,
					privacyAgreed,
					marketingAgreed
				})
			});
			const data = await res.json();
			if (!data.success) {
				error = data.error || '알 수 없는 오류가 발생했습니다.';
			} else {
				window.location.href = '/app';
			}
		} catch (e) {
			error = '서버 오류가 발생했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-4 py-12">
	<img src="/logo.jpg" alt="MatchTrip Logo" class="mb-8 h-48 w-auto object-contain shadow" />
	<form class="flex w-full max-w-xs flex-col gap-4" onsubmit={handleSubmit}>
		<h2 class="mb-2 text-center text-2xl font-bold text-gray-800">여행자 회원가입</h2>

		<!-- Email Input -->
		<label class="flex flex-col gap-1">
			<span class="text-sm font-medium text-gray-700">이메일</span>
			<input
				type="email"
				placeholder="이메일"
				class="rounded-md border border-gray-300 p-2 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				bind:value={email}
				disabled={isLoading}
				required />
		</label>

		<!-- Password Inputs Component -->
		<PasswordInputs {password} {confirmPassword} {isLoading} bind:this={passwordValidationRef} />

		<!-- Terms Agreement Component -->
		<TermsAgreement bind:this={termsComponent} {isLoading} on:change={checkTermsValidity} />

		<Button
			type="submit"
			loading={isLoading}
			loadingText="회원가입 중..."
			class="mt-4 w-full"
			disabled={!isFormValid || isLoading}>회원가입</Button>
		{#if error}
			<p class="mt-2 text-center text-sm text-red-500">{error}</p>
		{/if}
		<p class="mt-6 text-center text-sm text-gray-500">
			이미 계정이 있으신가요?
			<a href="/signin" class="ml-1 text-blue-500 hover:underline">로그인</a>
		</p>
	</form>
</div>

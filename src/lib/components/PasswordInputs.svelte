<script lang="ts" context="module">
	// Type for the component's public API
	export type PasswordInputsType = {
		validatePassword: () => boolean;
	};
</script>

<script lang="ts">
	// We need to fix the $props() for Svelte 5 compatibility
	const props = $props<{
		password: string;
		confirmPassword: string;
		isLoading: boolean;
	}>();

	// State variables
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let passwordsMatch = $derived(
		props.password === props.confirmPassword || props.confirmPassword === ''
	);
	let passwordsFocused = $state(false);
	let passwordValid = $state(true);
	let passwordError = $state('');

	// Password validation rules
	const MIN_LENGTH = 8;
	const MAX_LENGTH = 20;
	const HAS_NUMBER = /\d/;
	const HAS_SPECIAL_CHAR = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;

	// Toggle password visibility
	function togglePassword() {
		showPassword = !showPassword;
	}

	function toggleConfirmPassword() {
		showConfirmPassword = !showConfirmPassword;
	}

	function handleFocus() {
		passwordsFocused = true;
	}

	// Validate password when it changes
	$effect(() => {
		if (!props.password) {
			passwordValid = true;
			passwordError = '';
			return;
		}

		if (props.password.length < MIN_LENGTH) {
			passwordValid = false;
			passwordError = `비밀번호는 최소 ${MIN_LENGTH}자 이상이어야 합니다.`;
			return;
		}

		if (props.password.length > MAX_LENGTH) {
			passwordValid = false;
			passwordError = `비밀번호는 최대 ${MAX_LENGTH}자 이하여야 합니다.`;
			return;
		}

		if (!HAS_NUMBER.test(props.password)) {
			passwordValid = false;
			passwordError = '비밀번호에는 최소 1개의 숫자가 포함되어야 합니다.';
			return;
		}

		if (!HAS_SPECIAL_CHAR.test(props.password)) {
			passwordValid = false;
			passwordError = '비밀번호에는 최소 1개의 특수문자가 포함되어야 합니다.';
			return;
		}

		passwordValid = true;
		passwordError = '';
	});

	// Public API - validate password
	export function validatePassword(): boolean {
		// Check all validation rules
		if (!props.password) {
			return false;
		}

		if (props.password.length < MIN_LENGTH || props.password.length > MAX_LENGTH) {
			return false;
		}

		if (!HAS_NUMBER.test(props.password)) {
			return false;
		}

		if (!HAS_SPECIAL_CHAR.test(props.password)) {
			return false;
		}

		// Also check if passwords match
		return props.password === props.confirmPassword;
	}

	// Create event dispatcher for password changes
	function handlePasswordChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		const event = new CustomEvent('passwordChange', { detail: value });
		document.dispatchEvent(event);
	}

	function handleConfirmPasswordChange(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		const event = new CustomEvent('confirmPasswordChange', { detail: value });
		document.dispatchEvent(event);
	}
</script>

<div class="flex w-full flex-col gap-4">
	<!-- Password input -->
	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-gray-700">비밀번호</span>
		<div class="relative">
			<input
				type={showPassword ? 'text' : 'password'}
				placeholder="비밀번호"
				class="w-full rounded-md border {!passwordValid
					? 'border-red-500'
					: 'border-gray-300'} p-2 pr-10 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				value={props.password}
				onchange={handlePasswordChange}
				oninput={handlePasswordChange}
				disabled={props.isLoading}
				required />
			<button
				type="button"
				tabindex="-1"
				class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
				onclick={togglePassword}
				aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>
				{#if showPassword}
					<!-- Eye Off Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{:else}
					<!-- Eye Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
					</svg>
				{/if}
			</button>
		</div>
		{#if !passwordValid && props.password}
			<p class="mt-1 text-sm text-red-500">{passwordError}</p>
		{/if}
		<div class="mt-1 text-xs text-gray-500">
			비밀번호는 8~20자, 숫자 1개 이상, 특수문자 1개 이상을 포함해야 합니다.
		</div>
	</label>

	<!-- Confirm Password input -->
	<label class="flex flex-col gap-1">
		<span class="text-sm font-medium text-gray-700">비밀번호 확인</span>
		<div class="relative">
			<input
				type={showConfirmPassword ? 'text' : 'password'}
				placeholder="비밀번호 확인"
				class="w-full rounded-md border {!passwordsMatch && props.confirmPassword !== ''
					? 'border-red-500'
					: 'border-gray-300'} p-2 pr-10 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
				value={props.confirmPassword}
				onchange={handleConfirmPasswordChange}
				oninput={handleConfirmPasswordChange}
				disabled={props.isLoading}
				required
				onfocus={handleFocus} />
			<button
				type="button"
				tabindex="-1"
				class="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
				onclick={toggleConfirmPassword}
				aria-label={showConfirmPassword ? '비밀번호 숨기기' : '비밀번호 보기'}>
				{#if showConfirmPassword}
					<!-- Eye Off Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575m1.875-2.25A9.956 9.956 0 0112 3c5.523 0 10 4.477 10 10 0 1.657-.403 3.22-1.125 4.575m-1.875 2.25A9.956 9.956 0 0112 21c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{:else}
					<!-- Eye Icon -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
					</svg>
				{/if}
			</button>
		</div>
		{#if !passwordsMatch && props.confirmPassword !== '' && passwordsFocused}
			<p class="mt-1 text-sm text-red-500">비밀번호가 일치하지 않습니다.</p>
		{/if}
	</label>
</div>

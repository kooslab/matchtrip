<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let phoneNumber = $state('');
	let verificationCode = $state('');
	let showVerificationInput = $state(true); // Show verification input by default
	let isLoading = $state(false);
	let error = $state('');
	let resendTimer = $state(0);
	let timerInterval: number;

	// Pre-fill with existing phone if available
	$effect(() => {
		// Set initial phone number for testing
		if (!phoneNumber) {
			phoneNumber = '010-1234-5678'; // Default test number
		}
		if ($page.data.user?.phone) {
			phoneNumber = $page.data.user.phone;
		}
	});

	// Format phone number as user types
	function formatPhoneNumber(value: string): string {
		// Remove all non-numeric characters
		let cleaned = value.replace(/\D/g, '');
		
		// Format as Korean phone number (010-0000-0000)
		if (cleaned.length <= 3) {
			return cleaned;
		} else if (cleaned.length <= 7) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
		} else if (cleaned.length <= 11) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
		} else {
			// Don't allow more than 11 digits
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
		}
	}
	
	function handlePhoneInput(e: Event) {
		const input = e.target as HTMLInputElement;
		phoneNumber = formatPhoneNumber(input.value);
	}

	const isValidPhone = $derived(() => {
		const cleaned = phoneNumber.replace(/\D/g, '');
		return cleaned.length >= 10 && cleaned.length <= 11;
	});

	const canSendCode = $derived(isValidPhone() && !isLoading && resendTimer === 0);

	function startResendTimer() {
		resendTimer = 60; // 60 seconds
		timerInterval = setInterval(() => {
			resendTimer--;
			if (resendTimer <= 0) {
				clearInterval(timerInterval);
			}
		}, 1000);
	}

	async function handleSendCode() {
		if (!canSendCode) return;

		isLoading = true;
		error = '';

		try {
			// For now, just simulate sending code
			// In production, this would call an actual SMS API
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			showVerificationInput = true;
			startResendTimer();
		} catch (err) {
			error = '인증번호 전송에 실패했습니다. 다시 시도해주세요.';
		} finally {
			isLoading = false;
		}
	}

	async function handleVerify() {
		const cleanCode = verificationCode.replace(/\s/g, '');
		if (cleanCode.length !== 6 || isLoading) return;

		isLoading = true;
		error = '';

		try {
			console.log('Verifying code:', cleanCode);
			
			// Save phone number first
			const response = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ phone: phoneNumber.replace(/\D/g, '') })
			});

			if (!response.ok) {
				const errorData = await response.text();
				console.error('Failed to save phone number:', errorData);
				throw new Error('전화번호 저장에 실패했습니다.');
			}

			console.log('Phone saved successfully, navigating to birthdate page');
			// Navigate with goto and invalidate all to refresh server data
			await goto('/onboarding/birthdate', { invalidateAll: true });
		} catch (err) {
			console.error('Verification error:', err);
			error = err instanceof Error ? err.message : '인증에 실패했습니다.';
			isLoading = false;
		}
	}

	function handleSingleDigitInput(e: Event, index: number) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '').slice(-1); // Take only the last digit
		
		// Update the verification code string
		const codeArray = verificationCode.padEnd(6, ' ').split('');
		codeArray[index] = value || ' ';
		verificationCode = codeArray.join('').trim();
		
		// Auto-focus next input if value was entered
		if (value && index < 5) {
			const nextInput = document.getElementById(`code-input-${index + 1}`);
			nextInput?.focus();
		}
		
		// Update button state when all digits are entered
		const cleanCode = verificationCode.replace(/\s/g, '');
		console.log('Current verification code:', cleanCode, 'Length:', cleanCode.length);
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		const currentValue = verificationCode[index] || '';
		
		// Handle backspace
		if (e.key === 'Backspace') {
			if (!currentValue && index > 0) {
				e.preventDefault();
				const prevInput = document.getElementById(`code-input-${index - 1}`);
				prevInput?.focus();
			} else if (currentValue) {
				// Clear current digit
				const codeArray = verificationCode.padEnd(6, ' ').split('');
				codeArray[index] = ' ';
				verificationCode = codeArray.join('').trim();
			}
		}
		// Handle arrow keys
		else if (e.key === 'ArrowLeft' && index > 0) {
			e.preventDefault();
			const prevInput = document.getElementById(`code-input-${index - 1}`);
			prevInput?.focus();
		}
		else if (e.key === 'ArrowRight' && index < 5) {
			e.preventDefault();
			const nextInput = document.getElementById(`code-input-${index + 1}`);
			nextInput?.focus();
		}
	}

	// Cleanup timer on unmount
	$effect(() => {
		return () => {
			if (timerInterval) {
				clearInterval(timerInterval);
			}
		};
	});
</script>

<div class="min-h-screen bg-white flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full">
		<!-- Progress indicator -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-gray-600">2/4</span>
			</div>
			<div class="h-2 bg-gray-200 rounded-full overflow-hidden">
				<div class="h-full bg-blue-600 rounded-full transition-all duration-300" style="width: 50%"></div>
			</div>
		</div>

		<div class="space-y-8">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">휴대폰 번호 인증</h1>
				<p class="text-gray-600">안전한 서비스 이용을 위해 본인 인증을 진행해주세요</p>
			</div>

			<div class="space-y-6">
				<div>
					<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
						휴대폰 번호
					</label>
					<div class="flex gap-3">
						<input
							id="phone"
							type="tel"
							value={phoneNumber}
							oninput={handlePhoneInput}
							placeholder="010-0000-0000"
							class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base {showVerificationInput ? 'bg-gray-50 text-gray-500' : ''}"
							disabled={isLoading || showVerificationInput}
						/>
						<button
							onclick={handleSendCode}
							disabled={!canSendCode}
							class="px-6 py-3 text-white font-medium rounded-lg transition-colors whitespace-nowrap {canSendCode ? 'bg-gray-500 hover:bg-gray-600' : 'bg-gray-300 cursor-not-allowed'}"
						>
							{#if showVerificationInput}
								재전송
							{:else}
								인증번호 받기
							{/if}
						</button>
					</div>
				</div>

				{#if showVerificationInput}
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								인증번호
							</label>
							<div class="flex gap-2">
								{#each Array(6) as _, i}
									<input
										type="text"
										maxlength="1"
										value={verificationCode[i] || ''}
										oninput={(e) => handleSingleDigitInput(e, i)}
										onkeydown={(e) => handleKeyDown(e, i)}
										class="w-12 h-12 border border-gray-300 rounded-lg text-center text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all {verificationCode[i] ? 'bg-gray-50' : 'bg-white'}"
										disabled={isLoading}
										id={`code-input-${i}`}
									/>
								{/each}
							</div>
							<p class="text-sm text-gray-500 mt-2">
								{phoneNumber}로 전송된 인증번호를 입력해주세요
							</p>
						</div>

						<!-- Confirm button -->
						<button
							onclick={handleVerify}
							disabled={verificationCode.replace(/\s/g, '').length !== 6 || isLoading}
							class="w-full py-3 text-white font-medium rounded-lg transition-colors {verificationCode.replace(/\s/g, '').length === 6 && !isLoading ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}"
						>
							{isLoading ? '인증 중...' : '확인'}
						</button>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">
								인증번호가 오지 않나요?
							</span>
							<button
								type="button"
								onclick={handleSendCode}
								disabled={resendTimer > 0}
								class="text-sm text-gray-600 hover:text-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
							>
								재전송 {resendTimer > 0 ? `(${resendTimer}초)` : ''}
							</button>
						</div>
					</div>
				{/if}

				{#if error}
					<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-sm text-red-600">{error}</p>
					</div>
				{/if}
			</div>

			<!-- Information box -->
			<div class="p-4 bg-gray-50 rounded-lg">
				<p class="text-xs text-gray-600 font-medium mb-1">안내사항</p>
				<ul class="text-xs text-gray-600 space-y-0.5">
					<li>• 입력하신 번호로 인증번호가 전송됩니다</li>
					<li>• 인증번호는 3분간 유효합니다</li>
					<li>• 본인 명의의 휴대폰 번호를 입력해주세요</li>
				</ul>
			</div>
		</div>
	</div>
</div>
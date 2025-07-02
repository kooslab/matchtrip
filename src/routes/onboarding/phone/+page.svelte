<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let phoneNumber = $state('');
	let verificationCode = $state('');
	let showVerificationInput = $state(false);
	let isLoading = $state(false);
	let error = $state('');
	let resendTimer = $state(0);
	let timerInterval: number;

	// Pre-fill with existing phone if available
	$effect(() => {
		if ($page.data.user?.phone) {
			phoneNumber = $page.data.user.phone;
		}
	});

	// Format phone number as user types
	$effect(() => {
		// Remove all non-numeric characters
		let cleaned = phoneNumber.replace(/\D/g, '');
		
		// Format as Korean phone number (010-0000-0000)
		if (cleaned.length <= 3) {
			phoneNumber = cleaned;
		} else if (cleaned.length <= 7) {
			phoneNumber = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
		} else if (cleaned.length <= 11) {
			phoneNumber = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
		} else {
			// Don't allow more than 11 digits
			phoneNumber = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
		}
	});

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
		if (verificationCode.length !== 6 || isLoading) return;

		isLoading = true;
		error = '';

		try {
			// TEMPORARY: Accept any 6-digit code for testing
			// In production, this would verify against the actual sent code
			if (verificationCode.length !== 6) {
				throw new Error('인증번호는 6자리여야 합니다.');
			}
			
			// Just check if all digits are numbers (any 6 digits will pass)
			if (!/^\d{6}$/.test(verificationCode)) {
				throw new Error('인증번호는 숫자로만 구성되어야 합니다.');
			}

			// Save phone number
			const response = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ phone: phoneNumber.replace(/\D/g, '') })
			});

			if (!response.ok) {
				throw new Error('전화번호 저장에 실패했습니다.');
			}

			// Continue to birthdate page
			await goto('/onboarding/birthdate');
		} catch (err) {
			error = err instanceof Error ? err.message : '인증에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	function handleSingleDigitInput(e: Event, index: number) {
		const input = e.target as HTMLInputElement;
		const value = input.value.replace(/\D/g, '').slice(-1); // Take only the last digit
		
		// Update the verification code string
		const codeArray = verificationCode.split('');
		codeArray[index] = value;
		verificationCode = codeArray.join('');
		
		// Auto-focus next input if value was entered
		if (value && index < 5) {
			const nextInput = document.getElementById(`code-input-${index + 1}`);
			nextInput?.focus();
		}
		
		// Auto-submit if all 6 digits are entered
		if (verificationCode.length === 6) {
			handleVerify();
		}
	}

	function handleKeyDown(e: KeyboardEvent, index: number) {
		// Handle backspace
		if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
			e.preventDefault();
			const prevInput = document.getElementById(`code-input-${index - 1}`);
			prevInput?.focus();
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

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
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

		<div class="bg-white rounded-xl shadow-md p-8">
			<h1 class="text-2xl font-bold text-gray-900 mb-2">휴대폰 번호 인증</h1>
			<p class="text-gray-600 mb-8">안전한 서비스 이용을 위해 본인 인증을 진행해주세요</p>

			<div class="space-y-6">
				<div>
					<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
						휴대폰 번호
					</label>
					<div class="flex gap-3">
						<input
							id="phone"
							type="tel"
							bind:value={phoneNumber}
							placeholder="010-0000-0000"
							class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
							disabled={isLoading || showVerificationInput}
						/>
						<button
							onclick={handleSendCode}
							disabled={!canSendCode}
							class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
						>
							{#if resendTimer > 0}
								{resendTimer}초
							{:else if showVerificationInput}
								재전송
							{:else}
								인증번호 받기
							{/if}
						</button>
					</div>
				</div>

				{#if showVerificationInput}
					<div class="space-y-6">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								인증번호
							</label>
							<div class="flex gap-2 justify-between">
								{#each Array(6) as _, i}
									<input
										type="text"
										maxlength="1"
										value={verificationCode[i] || ''}
										oninput={(e) => handleSingleDigitInput(e, i)}
										onkeydown={(e) => handleKeyDown(e, i)}
										class="w-14 h-14 border-2 border-gray-300 rounded-lg text-center text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all {verificationCode[i] ? 'border-blue-500' : ''}"
										disabled={isLoading}
										id={`code-input-${i}`}
									/>
								{/each}
							</div>
							<p class="text-sm text-gray-500 mt-2">
								{phoneNumber}로 전송된 인증번호를 입력해주세요
							</p>
						</div>

						<div class="flex items-center justify-between text-sm">
							<span class="text-gray-600">
								인증번호가 오지 않나요?
							</span>
							<button
								type="button"
								onclick={handleSendCode}
								disabled={resendTimer > 0}
								class="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
							>
								{resendTimer > 0 ? `재전송 (${resendTimer}초)` : '재전송'}
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

			<div class="mt-8 p-4 bg-gray-50 rounded-lg">
				<p class="text-sm text-gray-600">
					<span class="font-medium">안내사항</span><br/>
					• 입력하신 번호로 인증번호가 전송됩니다<br/>
					• 인증번호는 3분간 유효합니다<br/>
					• 본인 명의의 휴대폰 번호를 입력해주세요
				</p>
			</div>
		</div>
	</div>
</div>
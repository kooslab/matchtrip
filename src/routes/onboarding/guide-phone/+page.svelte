<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import CountryCodeSelector from '$lib/components/CountryCodeSelector.svelte';
	import { countryCodes, type CountryCode } from '$lib/data/countryCodes';

	let selectedCountry = $state<CountryCode>(countryCodes[0]); // Default to Korea
	let phoneNumber = $state('');
	let isLoading = $state(false);
	let error = $state('');

	// Pre-fill with existing phone if available
	$effect(() => {
		if ($page.data.user?.phone) {
			// Try to parse existing phone number
			const phone = $page.data.user.phone;
			// Extract country code and number if possible
			// For now, just set the phone number without country code
			phoneNumber = phone;
		}
	});

	// Get maximum digits allowed for each country (mobile only)
	function getMaxDigits(countryCode: string): number {
		switch (countryCode) {
			case 'KR': return 10; // 010-1234-5678 (without leading 0)
			case 'US':
			case 'CA': return 10; // (123) 456-7890
			case 'DE': return 11; // 0151 12345678 (mobile)
			case 'FR': return 10; // 06 12 34 56 78 (mobile)
			case 'IT': return 10; // 333 123 4567 (mobile)
			case 'GB': return 11; // 07123 456789 (mobile)
			case 'ES': return 9;  // 612 34 56 78 (mobile)
			default: return 15;
		}
	}

	// Format phone number based on selected country
	function formatPhoneNumber(value: string, countryCode: string): string {
		// Remove all non-numeric characters
		let cleaned = value.replace(/\D/g, '');

		// Special handling for Korea to remove leading 0
		if (countryCode === 'KR' && cleaned.startsWith('0')) {
			cleaned = cleaned.substring(1);
		}

		// Get max digits for the country
		const maxDigits = getMaxDigits(countryCode);

		// Apply formatting based on country
		switch (countryCode) {
			case 'KR': // Korea mobile: 010-1234-5678
				cleaned = cleaned.slice(0, maxDigits);
				if (cleaned.length <= 2) return cleaned;
				else if (cleaned.length <= 6) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
				else return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;

			case 'US': // USA: (123) 456-7890
			case 'CA': // Canada uses same format
				cleaned = cleaned.slice(0, maxDigits);
				if (cleaned.length <= 3) return cleaned;
				else if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
				else return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;

			case 'DE': // Germany mobile: 0151 1234 5678
				cleaned = cleaned.slice(0, maxDigits);
				if (cleaned.length <= 4) return cleaned;
				else if (cleaned.length <= 8) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
				else return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;

			case 'FR': // France mobile: 06 12 34 56 78
				cleaned = cleaned.slice(0, maxDigits);
				if (cleaned.length <= 2) return cleaned;
				else {
					let formatted = cleaned.slice(0, 2);
					for (let i = 2; i < cleaned.length; i += 2) {
						formatted += ` ${cleaned.slice(i, i + 2)}`;
					}
					return formatted;
				}

			case 'IT': // Italy mobile: 333 123 4567
				cleaned = cleaned.slice(0, maxDigits);
				if (cleaned.length <= 3) return cleaned;
				else if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
				else return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;

			case 'GB': // UK mobile: 07123 456789
				cleaned = cleaned.slice(0, maxDigits);
				if (cleaned.length <= 5) return cleaned;
				else return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 11)}`;

			case 'ES': // Spain: 612 34 56 78
				cleaned = cleaned.slice(0, maxDigits);
				if (cleaned.length <= 3) return cleaned;
				else if (cleaned.length <= 5) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
				else if (cleaned.length <= 7)
					return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5)}`;
				else
					return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)}`;

			default:
				// For other countries, just limit to reasonable length
				return cleaned.slice(0, 15);
		}
	}

	function handlePhoneInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let newValue = input.value;
		let cleaned = newValue.replace(/\D/g, '');

		// Special handling for Korea
		if (selectedCountry.code === 'KR') {
			// Remove leading 0 if present
			if (cleaned.startsWith('0')) {
				cleaned = cleaned.substring(1);
			}
		}

		// Get max digits based on the country
		const maxDigits = getMaxDigits(selectedCountry.code);

		// If trying to add more digits than allowed, truncate
		if (cleaned.length > maxDigits) {
			cleaned = cleaned.slice(0, maxDigits);
		}

		// Format the truncated value
		phoneNumber = formatPhoneNumber(cleaned, selectedCountry.code);

		// Update the input value to reflect the formatted and truncated value
		input.value = phoneNumber;
	}

	const isValidPhone = $derived(() => {
		const cleaned = phoneNumber.replace(/\D/g, '');
		const maxDigits = getMaxDigits(selectedCountry.code);
		
		// Check if we have the expected number of digits
		return cleaned.length === maxDigits;
	});

	const isPhoneComplete = $derived(() => {
		const cleaned = phoneNumber.replace(/\D/g, '');
		const maxDigits = getMaxDigits(selectedCountry.code);

		return cleaned.length === maxDigits;
	});

	const canContinue = $derived(isValidPhone() && !isLoading);

	// Get placeholder based on selected country
	const getPlaceholder = (countryCode: string): string => {
		switch (countryCode) {
			case 'KR':
				return '10-1234-5678';
			case 'US':
			case 'CA':
				return '(123) 456-7890';
			case 'DE':
				return '0151 1234 5678';
			case 'FR':
				return '06 12 34 56 78';
			case 'IT':
				return '333 123 4567';
			case 'GB':
				return '07123 456789';
			case 'ES':
				return '612 34 56 78';
			default:
				return '1234567890';
		}
	};

	async function handleContinue() {
		if (!canContinue) return;

		isLoading = true;
		error = '';

		try {
			// Clean the phone number - remove all non-digits
			const cleanedPhone = phoneNumber.replace(/\D/g, '');
			
			// Combine country code and phone number (country code already has the +)
			const fullPhoneNumber = `${selectedCountry.dialCode}${cleanedPhone}`;
			
			console.log('Saving phone number:', fullPhoneNumber);
			
			// Save phone number
			const response = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ phone: fullPhoneNumber })
			});

			if (!response.ok) {
				const errorData = await response.text();
				console.error('Failed to save phone number:', errorData);
				throw new Error('전화번호 저장에 실패했습니다.');
			}

			console.log('Phone saved successfully, navigating to guide profile page');
			// Navigate to guide profile page
			await goto('/onboarding/guide-profile', { invalidateAll: true });
		} catch (err) {
			console.error('Save error:', err);
			error = err instanceof Error ? err.message : '저장에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-white px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Progress indicator -->
		<div class="mb-8">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm text-gray-600">2/4</span>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-blue-600 transition-all duration-300"
					style="width: 50%"
				></div>
			</div>
		</div>

		<div class="space-y-8">
			<div>
				<h1 class="mb-2 text-2xl font-bold text-gray-900">연락처 정보</h1>
				<p class="text-gray-600">여행자와의 원활한 소통을 위해 연락처를 입력해주세요</p>
			</div>

			<div class="space-y-6">
				<div>
					<label for="phone-number" class="mb-2 block text-sm font-medium text-gray-700">
						휴대폰 번호
					</label>
					<div class="flex gap-2">
						<CountryCodeSelector
							bind:value={selectedCountry}
							onchange={() => (phoneNumber = '')}
							disabled={isLoading}
						/>
						<input
							id="phone-number"
							type="tel"
							value={phoneNumber}
							oninput={handlePhoneInput}
							placeholder={getPlaceholder(selectedCountry.code)}
							disabled={isLoading}
							class="flex-1 rounded-lg border px-4 py-3 text-base transition-all outline-none focus:border-transparent focus:ring-2 {isPhoneComplete()
								? 'border-green-500 focus:ring-green-500'
								: 'border-gray-300 focus:ring-blue-500'} disabled:bg-gray-50 disabled:text-gray-500"
						/>
					</div>
					<p class="mt-2 text-xs {isPhoneComplete() ? 'text-green-600' : 'text-gray-500'}">
						{#if isPhoneComplete()}
							✓ 전화번호 입력이 완료되었습니다
						{:else}
							국가번호를 선택하고 전화번호를 입력해주세요
						{/if}
					</p>
				</div>

				{#if error}
					<div class="rounded-lg border border-red-200 bg-red-50 p-3">
						<p class="text-sm text-red-600">{error}</p>
					</div>
				{/if}

				<!-- Continue button -->
				<button
					onclick={handleContinue}
					disabled={!canContinue}
					class="w-full rounded-lg py-3 font-medium text-white transition-colors {canContinue
						? 'bg-blue-600 hover:bg-blue-700'
						: 'cursor-not-allowed bg-gray-300'}"
				>
					{isLoading ? '저장 중...' : '다음'}
				</button>
			</div>

			<!-- Information box -->
			<div class="rounded-lg bg-gray-50 p-4">
				<p class="mb-1 text-xs font-medium text-gray-600">안내사항</p>
				<ul class="space-y-0.5 text-xs text-gray-600">
					<li>• 가이드 등록 후 여행자와의 연락을 위해 사용됩니다</li>
					<li>• 정확한 연락처를 입력해주세요</li>
					<li>• 연락처는 마이페이지에서 수정 가능합니다</li>
				</ul>
			</div>
		</div>
	</div>
</div>

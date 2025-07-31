<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore, offerFormValidation } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import { createNumberInputHandler, formatNumberWithCommas } from '$lib/utils/numberFormatter';

	let tripId = $derived($page.url.searchParams.get('tripId'));

	// Bind to store value (raw number without commas)
	let rawPrice = $state($offerFormStore.pricePerPerson || '');
	// Display value with commas
	let displayValue = $state('');

	// Initialize display value
	$effect(() => {
		if (rawPrice) {
			displayValue = formatNumberWithCommas(rawPrice);
		}
	});

	// Update store when value changes
	$effect(() => {
		offerFormStore.setPricePerPerson(rawPrice);
	});

	function handleNext() {
		if ($offerFormValidation.isPriceValid) {
			goto(`/offers/create/description?tripId=${tripId}`);
		}
	}

	// Create the formatted number input handler
	const handlePriceInput = createNumberInputHandler(
		(value) => (rawPrice = value),
		(value) => (displayValue = value)
	);
</script>

<div class="flex-1 px-4 py-6 pb-40">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">1인당 제안 금액을 입력해 주세요</h2>
			<p class="mt-2 text-sm text-gray-500">
				여행자가 지불할 1인당 금액을 원화(KRW)로 입력해주세요.
			</p>
		</div>

		<!-- Price Input -->
		<div class="space-y-3">
			<label for="price" class="block text-sm font-medium text-gray-700"> 1인당 가격 </label>
			<div class="relative">
				<input
					id="price"
					type="text"
					value={displayValue}
					oninput={handlePriceInput}
					placeholder="1인당 금액을 입력해 주세요"
					class="focus:border-opacity-100 w-full rounded-lg border border-gray-300 px-4 py-3.5 text-base placeholder-gray-400 transition-colors focus:ring-1 focus:outline-none"
					style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
					onfocus={(e) => (e.currentTarget.style.borderColor = colors.primary)}
					onblur={(e) => (e.currentTarget.style.borderColor = '')}
				/>
				{#if displayValue}
					<div class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-gray-500">원</div>
				{/if}
			</div>
		</div>

		<!-- Helper Text -->
		<div class="rounded-lg bg-gray-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-gray-700">가격 책정 팁</h3>
			<ul class="space-y-1 text-sm text-gray-600">
				<li>• 교통비, 식사, 입장료 등 모든 비용을 고려하세요</li>
				<li>• 가이드 서비스료를 포함한 총액을 입력하세요</li>
				<li>• 경쟁력 있는 가격으로 제안하면 선택 확률이 높아집니다</li>
			</ul>
		</div>
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<div class="px-4 py-4 pb-4">
		<button
			onclick={handleNext}
			disabled={!$offerFormValidation.isPriceValid}
			class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all
				{$offerFormValidation.isPriceValid ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50'}"
			style="background-color: {$offerFormValidation.isPriceValid ? colors.primary : '#CBD5E1'}"
		>
			다음
		</button>
	</div>
</div>

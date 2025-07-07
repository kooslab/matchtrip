<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore, offerFormValidation } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';

	let tripId = $derived($page.url.searchParams.get('tripId'));

	// Bind to store value
	let pricePerPerson = $state($offerFormStore.pricePerPerson);

	// Update store when value changes
	$effect(() => {
		offerFormStore.setPricePerPerson(pricePerPerson);
	});

	function handleNext() {
		if ($offerFormValidation.isPriceValid) {
			goto(`/offers/create/description?tripId=${tripId}`);
		}
	}

	// Format number input
	function handlePriceInput(e: Event) {
		const input = e.target as HTMLInputElement;
		// Remove non-numeric characters
		const value = input.value.replace(/[^\d]/g, '');
		pricePerPerson = value;
	}

	// Format display value
	const formattedPrice = $derived.by(() => {
		if (!pricePerPerson) return '';
		return new Intl.NumberFormat('ko-KR').format(parseInt(pricePerPerson));
	});
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
					value={pricePerPerson}
					oninput={handlePriceInput}
					placeholder="1인당 금액을 입력해 주세요"
					class="focus:border-opacity-100 w-full rounded-lg border border-gray-300 px-4 py-3.5 text-base placeholder-gray-400 transition-colors focus:ring-1 focus:outline-none"
					style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
					onfocus={(e) => (e.currentTarget.style.borderColor = colors.primary)}
					onblur={(e) => (e.currentTarget.style.borderColor = '')}
				/>
				{#if pricePerPerson}
					<div class="absolute top-1/2 right-4 -translate-y-1/2 text-sm text-gray-500">원</div>
				{/if}
			</div>

			{#if formattedPrice}
				<p class="text-sm text-gray-600">
					입력한 금액: <span class="font-medium">{formattedPrice}원</span>
				</p>
			{/if}
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
	class="fixed right-0 bottom-16 left-0 bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
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

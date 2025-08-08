<script lang="ts">
	import { goto } from '$app/navigation';
	
	const { data } = $props();
	
	// Get product data from layout
	const productData = $derived(data.productData);
	
	// Form state
	let title = $state(productData.title || '');
	let price = $state(productData.price ? productData.price.toString() : '');
	let isSubmitting = $state(false);
	
	// Format price with commas
	function formatPrice(value: string) {
		// Remove non-digits
		const digits = value.replace(/\D/g, '');
		// Add commas
		return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}
	
	// Handle price input
	function handlePriceInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value.replace(/,/g, '');
		if (/^\d*$/.test(value)) {
			price = value;
			target.value = formatPrice(value);
		}
	}
	
	// Validate and submit
	async function handleSubmit() {
		if (!price || parseInt(price) === 0) {
			window.alert('가격을 입력해주세요');
			return;
		}
		
		isSubmitting = true;
		
		try {
			// Save to cookies
			await fetch('/api/products/create/save-step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					step: 'price',
					data: { 
						price: parseInt(price),
						title: title || `상품 - ${new Date().toLocaleDateString()}`
					}
				})
			});
			
			// Navigate to next step
			await goto('/products/create/description');
		} catch (error) {
			console.error('Error saving price:', error);
			window.alert('저장 중 오류가 발생했습니다');
			isSubmitting = false;
		}
	}
</script>

<div class="flex-1 bg-white p-4">
	<!-- Title -->
	<div class="mb-8">
		<h2 class="text-lg text-gray-600">1인당 금액을 입력해 주세요</h2>
	</div>
	
	<!-- Form -->
	<div class="space-y-6">
		<!-- Product Title (Hidden but can be added if needed) -->
		<input type="hidden" bind:value={title} />
		
		<!-- Price Input -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				1인당 가격
			</label>
			<div class="relative">
				<input
					type="text"
					inputmode="numeric"
					placeholder="1인당 금액을 입력해 주세요"
					value={formatPrice(price)}
					oninput={handlePriceInput}
					class="w-full px-4 pr-12 py-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none text-right text-lg"
				/>
				<span class="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-500">원</span>
			</div>
		</div>
	</div>
	
	<!-- Submit Button -->
	<div class="fixed bottom-0 left-0 right-0 bg-white p-4">
		<div class="mx-auto max-w-[430px]">
			<button
				onclick={handleSubmit}
				disabled={!price || parseInt(price) === 0 || isSubmitting}
				class="w-full rounded-lg bg-blue-500 py-4 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{isSubmitting ? '저장 중...' : '다음'}
			</button>
		</div>
	</div>
</div>
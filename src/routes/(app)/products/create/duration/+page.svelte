<script lang="ts">
	import { goto } from '$app/navigation';
	
	const { data } = $props();
	
	// Get product data from layout
	const productData = $derived(data.productData);
	
	// Form state
	let duration = $state(productData.duration ? productData.duration.toString() : '');
	let needsConsultation = $state(false);
	let isSubmitting = $state(false);
	
	// Handle duration input
	function handleDurationInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const value = target.value;
		// Only allow numbers
		if (/^\d*$/.test(value)) {
			duration = value;
		} else {
			target.value = duration;
		}
	}
	
	// Validate and submit
	async function handleSubmit() {
		if (!needsConsultation && (!duration || parseInt(duration) === 0)) {
			window.alert('투어 시간을 입력하거나 상담이 필요함을 체크해주세요');
			return;
		}
		
		isSubmitting = true;
		
		try {
			// Save to cookies
			await fetch('/api/products/create/save-step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					step: 'duration',
					data: { 
						duration: needsConsultation ? null : parseInt(duration)
					}
				})
			});
			
			// Navigate to next step
			goto('/products/create/languages');
		} catch (error) {
			console.error('Error saving duration:', error);
			window.alert('저장 중 오류가 발생했습니다');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex-1 bg-white p-4">
	<!-- Title -->
	<div class="mb-8">
		<h2 class="text-lg text-gray-600">투어 시간을 입력해주세요</h2>
	</div>
	
	<!-- Form -->
	<div class="space-y-6">
		<!-- Duration Input -->
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-2">
				투어 시간
			</label>
			<div class="relative">
				<input
					type="text"
					inputmode="numeric"
					placeholder="총 투어 시간을 입력해 주세요"
					value={duration}
					oninput={handleDurationInput}
					disabled={needsConsultation}
					class="w-full px-4 pr-16 py-3 border-b border-gray-300 focus:border-blue-500 focus:outline-none text-right text-lg disabled:bg-gray-50 disabled:text-gray-400"
				/>
				<span class="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-500">시간</span>
			</div>
		</div>
		
		<!-- Consultation Checkbox -->
		<label class="flex items-center gap-3 cursor-pointer">
			<input
				type="checkbox"
				bind:checked={needsConsultation}
				class="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
			/>
			<span class="text-sm text-gray-700">상담이 필요해요</span>
		</label>
	</div>
	
	<!-- Submit Button -->
	<div class="fixed bottom-0 left-0 right-0 bg-white p-4">
		<div class="mx-auto max-w-[430px]">
			<button
				onclick={handleSubmit}
				disabled={(!duration || parseInt(duration) === 0) && !needsConsultation || isSubmitting}
				class="w-full rounded-lg bg-blue-500 py-4 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{isSubmitting ? '저장 중...' : '다음'}
			</button>
		</div>
	</div>
</div>
<script lang="ts">
	interface Props {
		onClose: () => void;
		onSubmit: (data: { price: number; duration: number }) => void;
		sending?: boolean;
	}
	
	const { onClose, onSubmit, sending = false }: Props = $props();
	
	let price = $state('');
	let duration = $state('');
	
	// Format price input with commas
	function formatPriceInput(value: string) {
		// Remove non-numeric characters
		const numericValue = value.replace(/[^0-9]/g, '');
		// Add commas
		return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}
	
	// Handle price input
	function handlePriceInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const formatted = formatPriceInput(input.value);
		price = formatted;
	}
	
	// Handle duration input
	function handleDurationInput(event: Event) {
		const input = event.target as HTMLInputElement;
		// Only allow numbers
		const numericValue = input.value.replace(/[^0-9]/g, '');
		duration = numericValue;
	}
	
	// Handle form submission
	function handleSubmit() {
		const priceValue = parseInt(price.replace(/,/g, ''));
		const durationValue = parseInt(duration);
		
		if (!priceValue || !durationValue) {
			alert('가격과 일정을 입력해주세요.');
			return;
		}
		
		onSubmit({
			price: priceValue,
			duration: durationValue
		});
	}
</script>

<!-- Backdrop -->
<div 
	class="fixed inset-0 bg-black/50 z-50 flex items-end"
	onclick={onClose}
>
	<!-- Modal -->
	<div 
		class="w-full max-w-[430px] mx-auto bg-white rounded-t-2xl p-4"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
		
		<h2 class="text-lg font-bold mb-4">제안하기</h2>
		
		<!-- Price Input -->
		<div class="mb-4">
			<label class="block text-sm font-medium text-gray-700 mb-2">
				총 금액
			</label>
			<div class="relative">
				<input
					type="text"
					value={price}
					oninput={handlePriceInput}
					placeholder="여행 총 금액을 입력해 주세요"
					class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					disabled={sending}
				/>
				<span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
					원
				</span>
			</div>
		</div>
		
		<!-- Duration Input -->
		<div class="mb-4">
			<label class="block text-sm font-medium text-gray-700 mb-2">
				여행 일정
			</label>
			<div class="relative">
				<input
					type="text"
					value={duration}
					oninput={handleDurationInput}
					placeholder="몇일 일정인지 입력해 주세요"
					class="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					disabled={sending}
				/>
				<span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
					일
				</span>
			</div>
		</div>
		
		<!-- Submit Button -->
		<button
			onclick={handleSubmit}
			disabled={!price || !duration || sending}
			class="w-full bg-blue-500 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{sending ? '전송 중...' : '제안하기'}
		</button>
	</div>
</div>
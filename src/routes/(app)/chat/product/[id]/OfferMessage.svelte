<script lang="ts">
	interface Props {
		message: any;
		currentUserId: string;
		userRole: 'traveler' | 'guide';
	}
	
	const { message, currentUserId, userRole }: Props = $props();
	
	const isOwnMessage = $derived(message.senderId === currentUserId);
	const offerData = $derived(message.metadata as { price: number; duration: number });
	
	// Format price with commas
	function formatPrice(price: number) {
		return new Intl.NumberFormat('ko-KR').format(price);
	}
	
	// Handle accept offer
	async function handleAccept() {
		// TODO: Implement accept offer logic
		console.log('Accept offer:', message.id);
	}
</script>

<div class="bg-white rounded-2xl border shadow-sm p-4 max-w-xs">
	{#if isOwnMessage}
		<!-- Guide's own offer -->
		<div>
			<p class="text-xs text-gray-500 mb-2">나의 제안 금액</p>
			<p class="text-2xl font-bold mb-3">{formatPrice(offerData.price)}원</p>
			
			{#if message.content}
				<div class="border-t pt-3">
					<p class="text-sm font-semibold mb-1">결제 요청</p>
					<p class="text-sm text-gray-600">
						{message.content}
					</p>
				</div>
			{/if}
			
			<div class="mt-3 text-xs text-gray-500">
				{offerData.duration}일 일정
			</div>
		</div>
	{:else}
		<!-- Traveler sees guide's offer -->
		<div>
			<p class="text-sm font-semibold mb-2">결제 요청</p>
			<p class="text-xs text-gray-600 mb-3">
				여행 제안이 도착했습니다.<br />
				세부 일정은 메시지 또는 여행일정표를 가이드에게 요청하세요.
			</p>
			
			<div class="bg-gray-50 rounded-lg p-3 mb-3">
				<div class="flex justify-between items-center mb-2">
					<span class="text-xs text-gray-500">금액</span>
					<span class="text-lg font-bold">{formatPrice(offerData.price)}원</span>
				</div>
				<div class="flex justify-between items-center">
					<span class="text-xs text-gray-500">일정</span>
					<span class="text-sm font-medium">{offerData.duration}일</span>
				</div>
			</div>
			
			{#if userRole === 'traveler'}
				<button
					onclick={handleAccept}
					class="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors"
				>
					결제하기
				</button>
			{/if}
		</div>
	{/if}
</div>
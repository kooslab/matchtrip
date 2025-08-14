<script lang="ts">
	import ProductPaymentModal from './ProductPaymentModal.svelte';
	
	interface Props {
		message: any;
		currentUserId: string;
		userRole: 'traveler' | 'guide';
		product: any;
		guide: any;
		productOfferId?: string;
		conversationId?: string;
	}
	
	const { message, currentUserId, userRole, product, guide, productOfferId, conversationId }: Props = $props();
	
	const isOwnMessage = $derived(message.senderId === currentUserId);
	const offerData = $derived(message.metadata as { price: number; duration: number; startDate?: string; endDate?: string });
	
	let showPaymentModal = $state(false);
	
	// Format price with commas
	function formatPrice(price: number) {
		return new Intl.NumberFormat('ko-KR').format(price);
	}
	
	// Format date for display
	function formatDate(dateStr: string | undefined) {
		if (!dateStr) return null;
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('ko-KR', {
			month: 'numeric',
			day: 'numeric'
		}).format(date);
	}
	
	// Handle accept offer
	async function handleAccept() {
		showPaymentModal = true;
	}
	
	// Create product offer object for payment modal
	const productOffer = $derived({
		id: productOfferId || null,  // Use the actual productOfferId from database, or null if not present
		price: offerData.price,
		duration: offerData.duration,
		startDate: offerData.startDate ? new Date(offerData.startDate) : null,
		endDate: offerData.endDate ? new Date(offerData.endDate) : null
	});
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
				{#if offerData.startDate && offerData.endDate}
					{formatDate(offerData.startDate)} - {formatDate(offerData.endDate)} ({offerData.duration}일)
				{:else}
					{offerData.duration}일 일정
				{/if}
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
					<span class="text-sm font-medium">
						{#if offerData.startDate && offerData.endDate}
							{formatDate(offerData.startDate)} - {formatDate(offerData.endDate)}
						{:else}
							{offerData.duration}일
						{/if}
					</span>
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

<!-- Payment Modal -->
{#if showPaymentModal && !isOwnMessage && userRole === 'traveler'}
	<ProductPaymentModal
		isOpen={showPaymentModal}
		onClose={() => showPaymentModal = false}
		{productOffer}
		{product}
		{guide}
		{conversationId}
	/>
{/if}
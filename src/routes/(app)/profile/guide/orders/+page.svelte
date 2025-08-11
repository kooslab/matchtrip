<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, Calendar, Users, CreditCard } from 'lucide-svelte';
	import { formatDate } from '$lib/utils/dateFormatter';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';

	const { data } = $props();
	const orders = $derived(data.orders || []);
	
	// Track loading state for each order
	let loadingStates = $state<Record<string, boolean>>({});
	// Track review requested state for each order
	let reviewRequestedStates = $state<Record<string, Date | null>>({});

	function getPaymentStatusText(status: string | null | undefined) {
		if (!status) return '결제 대기';
		switch (status) {
			case 'completed':
				return '결제 완료';
			case 'cancelled':
				return '취소됨';
			case 'refunded':
				return '환불됨';
			case 'failed':
				return '결제 실패';
			default:
				return '결제 진행중';
		}
	}

	function getPaymentStatusClass(status: string | null | undefined) {
		if (!status) return 'text-gray-500';
		switch (status) {
			case 'completed':
				return 'text-green-600';
			case 'cancelled':
			case 'refunded':
				return 'text-red-600';
			case 'failed':
				return 'text-orange-600';
			default:
				return 'text-blue-600';
		}
	}

	function formatPrice(amount: number) {
		return new Intl.NumberFormat('ko-KR').format(amount);
	}

	async function handleReviewRequest(order: any) {
		const orderId = order.type === 'trip' ? order.id : order.paymentId;
		loadingStates[orderId] = true;
		
		try {
			const endpoint = order.type === 'trip' 
				? `/api/offers/${order.id}/request-review`
				: `/api/products/${order.productId}/request-review`;
			
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					paymentId: order.paymentId,
					buyerId: order.buyerId
				})
			});

			if (response.ok) {
				// Update the review requested state for this order
				reviewRequestedStates[orderId] = new Date();
			} else {
				const error = await response.json();
				alert(error.message || '리뷰 요청 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Review request error:', error);
			alert('리뷰 요청 중 오류가 발생했습니다.');
		} finally {
			loadingStates[orderId] = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50 pb-24">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-100 bg-white">
		<div class="flex h-14 items-center px-4">
			<button onclick={() => window.history.back()} class="-ml-2 p-2">
				<ChevronLeft class="h-5 w-5" />
			</button>
			<h1 class="ml-2 text-lg font-semibold">결제/취소 내역</h1>
		</div>
	</header>

	<!-- Content -->
	<div class="p-4">
		{#if orders.length === 0}
			<div class="rounded-lg bg-white p-8 text-center">
				<p class="text-gray-500">아직 완료된 주문이 없습니다.</p>
			</div>
		{:else}
			<div class="space-y-4">
				{#each orders as order}
					{@const orderId = order.type === 'trip' ? order.id : order.paymentId}
					{@const isLoading = loadingStates[orderId] || false}
					{@const isRequested = reviewRequestedStates[orderId] || order.reviewRequestedAt}
					<button
						onclick={() => {
							if (order.type === 'trip' && order.id) {
								goto(`/profile/guide/orders/${order.id}`);
							}
						}}
						class="w-full rounded-lg bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
					>
						<!-- Order Type and Date -->
						<div class="mb-2 flex items-center justify-between">
							<span class="text-sm text-gray-500">
								{formatDate(order.paymentCreatedAt || order.createdAt)}
							</span>
							<span class="text-xs font-medium px-2 py-1 rounded-full {order.type === 'trip' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}">
								{order.type === 'trip' ? '여행' : '상품'}
							</span>
						</div>

						<!-- Payment Status Badge -->
						<div class="mb-3">
							<span
								class={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
									order.paymentStatus === 'completed'
										? 'bg-green-100 text-green-800'
										: order.paymentStatus === 'cancelled' || order.paymentStatus === 'refunded'
											? 'bg-red-100 text-red-800'
											: 'bg-gray-100 text-gray-800'
								}`}
							>
								{getPaymentStatusText(order.paymentStatus)}
							</span>
						</div>

						<!-- Order Title -->
						<h3 class="mb-2 font-semibold text-gray-900">{order.title}</h3>

						<!-- Order Info -->
						<div class="mb-3 space-y-1 text-sm text-gray-600">
							{#if order.type === 'trip'}
								<div class="flex items-center gap-2">
									<Calendar class="h-4 w-4" />
									<span>{formatDate(order.tripStartDate)} - {formatDate(order.tripEndDate)}</span>
								</div>
								<div class="flex items-center gap-2">
									<Users class="h-4 w-4" />
									<span>
										성인 {order.adultsCount}명{order.childrenCount > 0
											? `, 아동 ${order.childrenCount}명`
											: ''}
									</span>
								</div>
							{:else}
								<div class="flex items-center gap-2">
									<CreditCard class="h-4 w-4" />
									<span>상품 구매</span>
								</div>
								{#if order.productOfferDuration}
									<div class="text-xs text-gray-500">
										{order.productOfferDuration}일 일정
									</div>
								{/if}
							{/if}
						</div>

						<!-- Customer Info -->
						<div class="border-t border-gray-100 pt-3">
							<p class="text-sm text-gray-600">주문자 정보</p>
							<p class="font-medium">{order.buyerName || '알 수 없음'}</p>
						</div>

						<!-- Payment Info -->
						{#if order.paymentAmount}
							<div class="mt-3 border-t border-gray-100 pt-3">
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">총 결제금액</span>
									<span class="text-lg font-semibold">{formatPrice(order.paymentAmount)}원</span>
								</div>
							</div>
						{/if}

						<!-- Review Request Button -->
						{#if order.paymentStatus === 'completed' && !order.hasReview}
							<div class="mt-3 border-t border-gray-100 pt-3">
								{#if isRequested}
									<div class="text-center text-sm text-gray-500">
										리뷰 요청됨 ({formatDate(isRequested)})
									</div>
								{:else}
									<button
										onclick={() => handleReviewRequest(order)}
										disabled={isLoading}
										class="w-full rounded-lg py-2 text-sm font-medium text-white transition-colors {isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}"
									>
										{#if isLoading}
											<span class="inline-flex items-center">
												<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												처리 중...
											</span>
										{:else}
											리뷰 요청
										{/if}
									</button>
								{/if}
							</div>
						{:else if order.hasReview}
							<div class="mt-3 border-t border-gray-100 pt-3">
								<div class="text-center text-sm text-green-600">
									✓ 리뷰 작성 완료
								</div>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Bottom Navigation -->
	<GuideBottomNav />
</div>

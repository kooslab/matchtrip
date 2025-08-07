<script lang="ts">
	import { goto } from '$app/navigation';
	import { Receipt, Calendar, MapPin, User, CreditCard, ArrowLeft } from 'lucide-svelte';

	let { data } = $props();
	let order = $derived(data.order);

	function formatDate(date: Date | string | null) {
		if (!date) return '날짜 정보 없음';
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(date: Date | string | null) {
		if (!date) return '날짜 정보 없음';
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatTravelMethod(method: string | null) {
		if (!method) return '미정';

		const methodMap: Record<string, string> = {
			walking: '도보',
			driving: '자동차',
			public_transport: '대중교통',
			bike: '자전거',
			'walking+public_transport': '도보+대중교통',
			'walking+bike': '도보+자전거',
			'walking+driving': '도보+자동차',
			'walking+driving+public_transport': '도보+자동차+대중교통',
			'walking+driving+bike': '도보+자동차+자전거',
			'walking+driving+public_transport+bike': '모든 교통수단',
			other: '기타'
		};

		return methodMap[method] || method;
	}

	function goToTripDetails(tripId: string) {
		goto(`/my-trips/${tripId}`);
	}

	function getPaymentStatusText(status: string) {
		const statusMap: Record<string, string> = {
			completed: '결제 완료',
			cancelled: '결제 취소',
			pending: '결제 대기',
			failed: '결제 실패',
			refunded: '환불 완료'
		};
		return statusMap[status] || status;
	}

	function getPaymentStatusColor(status: string) {
		const colorMap: Record<string, string> = {
			completed: 'bg-emerald-600 text-white',
			cancelled: 'bg-red-100 text-red-800',
			pending: 'bg-yellow-100 text-yellow-800',
			failed: 'bg-red-100 text-red-800',
			refunded: 'bg-purple-100 text-purple-800'
		};
		return colorMap[status] || 'bg-gray-100 text-gray-800';
	}

	let showCancelModal = $state(false);

	async function cancelPayment() {
		showCancelModal = true;
	}

	async function confirmCancelPayment() {
		if (!order.conversationId) {
			alert('대화방을 찾을 수 없습니다. 고객센터에 문의해주세요.');
			showCancelModal = false;
			return;
		}

		try {
			// Send cancellation request message to the appropriate chat
			const chatUrl = order.type === 'trip' 
				? `/api/conversations/${order.conversationId}`
				: `/api/product-conversations/${order.conversationId}`;
			
			const response = await fetch(chatUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					messageType: 'cancellation_request',
					content: '결제 취소 요청',
					metadata: {
						reason: '고객이 결제를 취소하려고 합니다.',
						paymentId: order.payment.id,
						offerId: order.offer?.id || null,
						productOfferId: order.productOffer?.id || null,
						status: 'pending'
					}
				})
			});

			if (response.ok) {
				showCancelModal = false;
				// Redirect to the appropriate chat
				if (order.type === 'trip') {
					goto(`/chat/${order.conversationId}`);
				} else {
					goto(`/chat/product/${order.conversationId}`);
				}
			} else {
				throw new Error('Failed to send cancellation request');
			}
		} catch (err) {
			console.error('Error sending cancellation request:', err);
			alert('취소 요청 전송에 실패했습니다. 다시 시도해주세요.');
			showCancelModal = false;
		}
	}
</script>

<svelte:head>
	<title>주문 상세 - MatchTrip</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<button
			class="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
			onclick={() => goto('/order-history')}
		>
			<ArrowLeft class="h-4 w-4" />
			주문 내역으로 돌아가기
		</button>
		<h1 class="text-3xl font-bold text-gray-900">주문 상세</h1>
	</div>

	<!-- Order Summary -->
	<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6">
		<div class="mb-4 flex items-start justify-between gap-4">
			<div class="flex-1">
				<h2 class="text-xl font-semibold text-gray-900">
					{#if order.type === 'trip'}
						{order.destination?.city || '알 수 없는 도시'}, {order.destination?.country || '알 수 없는 국가'}
					{:else}
						{order.productTitle || '알 수 없는 상품'}
					{/if}
				</h2>
				<p class="mt-1 text-sm text-gray-500">
					주문 번호: <span class="font-mono text-xs">{order.payment.id}</span>
				</p>
			</div>
			<span
				class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap {getPaymentStatusColor(
					order.payment.status
				)}"
			>
				{getPaymentStatusText(order.payment.status)}
			</span>
		</div>

		<div class="space-y-6">
			<!-- Trip/Product Information -->
			<div>
				<h3 class="mb-4 text-lg font-medium text-gray-900">
					{order.type === 'trip' ? '여행 정보' : '상품 정보'}
				</h3>
				<div class="space-y-3">
					{#if order.type === 'trip'}
						<div class="flex items-start gap-3">
							<Calendar class="mt-0.5 h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm font-medium text-gray-900">여행 일정</p>
								<p class="text-sm text-gray-600">
									{formatDate(order.startDate)} ~ {formatDate(order.endDate)}
								</p>
							</div>
						</div>

						<div class="flex items-start gap-3">
							<MapPin class="mt-0.5 h-5 w-5 text-gray-400" />
							<div>
								<p class="text-sm font-medium text-gray-900">인원</p>
								<p class="text-sm text-gray-600">
									성인 {order.adultsCount || 0}명{order.childrenCount > 0
										? `, 유아 ${order.childrenCount}명`
										: ''}
								</p>
							</div>
						</div>

						{#if order.travelMethod}
							<div class="flex items-start gap-3">
								<MapPin class="mt-0.5 h-5 w-5 text-gray-400" />
								<div>
									<p class="text-sm font-medium text-gray-900">이동 수단</p>
									<p class="text-sm text-gray-600">
										{formatTravelMethod(order.travelMethod)}
									</p>
								</div>
							</div>
						{/if}
					{:else}
						<!-- Product specific info -->
						{#if order.productDuration}
							<div class="flex items-start gap-3">
								<Calendar class="mt-0.5 h-5 w-5 text-gray-400" />
								<div>
									<p class="text-sm font-medium text-gray-900">상품 일정</p>
									<p class="text-sm text-gray-600">
										{order.productDuration}일 일정
									</p>
								</div>
							</div>
						{/if}
						
					{/if}

					<div class="flex items-start gap-3">
						<User class="mt-0.5 h-5 w-5 text-gray-400" />
						<div>
							<p class="text-sm font-medium text-gray-900">가이드</p>
							<p class="text-sm text-gray-600">
								{order.guide?.name || '알 수 없는 가이드'}
							</p>
							<p class="text-xs text-gray-500">{order.guide?.email || ''}</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Payment Information -->
			<div>
				<h3 class="mb-4 text-lg font-medium text-gray-900">결제 정보</h3>
				<div class="space-y-3">
					<div class="flex items-start gap-3">
						<CreditCard class="mt-0.5 h-5 w-5 text-gray-400" />
						<div>
							<p class="text-sm font-medium text-gray-900">결제 수단</p>
							<p class="text-sm text-gray-600">
								{order.payment.paymentMethod || '카드'}
							</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<Receipt class="mt-0.5 h-5 w-5 text-gray-400" />
						<div>
							<p class="text-sm font-medium text-gray-900">
								{order.payment.status === 'cancelled' ? '취소 일시' : '결제 일시'}
							</p>
							<p class="text-sm text-gray-600">
								{formatDateTime(
									order.payment.updatedAt || order.payment.paidAt || order.payment.createdAt
								)}
							</p>
						</div>
					</div>

					<div class="mt-4 rounded-lg bg-gray-50 p-4">
						<div class="flex items-center justify-between">
							<span class="text-sm font-medium text-gray-900">총 결제 금액</span>
							<span
								class="text-2xl font-bold {order.payment.status === 'cancelled'
									? 'text-gray-500 line-through'
									: 'text-pink-600'}"
							>
								{order.payment.amount.toLocaleString()}원
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Product Description (Product only) -->
	{#if order.type === 'product' && order.productDescription}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6">
			<h3 class="mb-4 text-lg font-medium text-gray-900">상품 설명</h3>
			<div class="prose prose-sm max-w-none text-gray-700 prose-img:rounded-lg prose-img:my-4">
				{@html order.productDescription}
			</div>
		</div>
	{/if}

	<!-- Itinerary (Trip only) -->
	{#if order.type === 'trip' && order.offer?.itinerary}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6">
			<h3 class="mb-4 text-lg font-medium text-gray-900">여행 일정</h3>
			<div class="prose prose-sm max-w-none text-gray-700">
				{@html order.offer.itinerary}
			</div>
		</div>
	{/if}

	<!-- Custom Request (Trip only) -->
	{#if order.type === 'trip' && order.customRequest}
		<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6">
			<h3 class="mb-4 text-lg font-medium text-gray-900">특별 요청사항</h3>
			<p class="text-gray-700">{order.customRequest}</p>
		</div>
	{/if}

	<!-- Actions -->
	<div class="flex justify-center gap-3">
		{#if order.type === 'trip' && order.id}
			<button
				onclick={() => goToTripDetails(order.id)}
				class="rounded-lg bg-pink-500 px-8 py-3 font-medium text-white hover:bg-pink-600"
			>
				여행 상세보기
			</button>
		{/if}
		{#if order.payment.status === 'completed'}
			<button
				onclick={cancelPayment}
				class="rounded-lg bg-gray-500 px-8 py-3 font-medium text-white hover:bg-gray-600"
			>
				결제 취소
			</button>
		{/if}
	</div>
	
	<!-- Cancel Payment Modal -->
	{#if showCancelModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
			<div class="w-full max-w-sm rounded-2xl bg-white p-6">
				<h2 class="mb-4 text-center text-xl font-bold">결제 취소</h2>
				<p class="mb-6 text-center text-gray-600">
					정말 결제를 취소하시겠습니까?
				</p>
				<div class="flex gap-3">
					<button
						onclick={() => showCancelModal = false}
						class="flex-1 rounded-lg border border-gray-300 py-3 font-medium text-gray-700 hover:bg-gray-50"
					>
						취소
					</button>
					<button
						onclick={confirmCancelPayment}
						class="flex-1 rounded-lg bg-red-500 py-3 font-medium text-white hover:bg-red-600"
					>
						결제 취소
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';

	let { data } = $props();
	let orders = $derived(data.orders);

	function formatOrderDate(date: Date | string) {
		return formatDate(date, {
			locale: $userLocale,
			timezone: $userTimezone,
			format: 'long'
		});
	}
	
	function getPaymentStatusText(status: string) {
		const statusMap: Record<string, string> = {
			completed: '결제 완료',
			cancelled: '결제 취소',
			pending: '결제 대기',
			failed: '결제 실패'
		};
		return statusMap[status] || status;
	}
	
	function getPaymentStatusColor(status: string) {
		const colorMap: Record<string, string> = {
			completed: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800',
			pending: 'bg-yellow-100 text-yellow-800',
			failed: 'bg-red-100 text-red-800'
		};
		return colorMap[status] || 'bg-gray-100 text-gray-800';
	}
</script>

<svelte:head>
	<title>주문 내역 - MatchTrip</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">주문 내역</h1>
		<p class="mt-2 text-gray-600">결제 내역을 확인하세요</p>
	</div>

	{#if orders.length === 0}
		<!-- Empty State -->
		<div class="rounded-lg border border-gray-200 bg-white p-12 text-center">
			<div class="mb-4 text-6xl">🛒</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">아직 주문 내역이 없습니다</h3>
			<p class="mb-6 text-gray-600">여행 제안을 수락하고 결제를 완료하면 여기에 표시됩니다</p>
			<button
				onclick={() => goto('/trips')}
				class="rounded-lg bg-pink-500 px-6 py-2 text-white hover:bg-pink-600"
			>
				여행 둘러보기
			</button>
		</div>
	{:else}
		<!-- Order List -->
		<div class="space-y-4">
			{#each orders as order}
				<div
					class="cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md {order.payment.status === 'cancelled' ? 'opacity-75' : ''}"
					onclick={() => goto(`/order-history/details?id=${order.payment.id}`)}
				>
					<div class="flex items-center justify-between">
						<!-- Left side - Order info -->
						<div class="flex-1">
							<div class="flex items-center gap-4 mb-2">
								<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getPaymentStatusColor(order.payment.status)}">
									{getPaymentStatusText(order.payment.status)}
								</span>
							</div>
							<div class="flex items-center gap-4">
								<div>
									<h3 class="font-medium text-gray-900">
										{order.destination?.city || '알 수 없는 도시'}
									</h3>
									<p class="text-sm text-gray-500">
										{formatDateRange(order.startDate, order.endDate, {
											locale: $userLocale,
											timezone: $userTimezone,
											format: 'long'
										})}
									</p>
								</div>
								<div class="hidden sm:block">
									<p class="text-sm text-gray-600">
										{order.guide?.name || '알 수 없는 가이드'} 가이드
									</p>
								</div>
							</div>
						</div>

						<!-- Right side - Payment info -->
						<div class="text-right">
							<p class="font-semibold {order.payment.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gray-900'}">
								{order.payment.amount.toLocaleString()}원
							</p>
							<p class="text-xs text-gray-500">
								{formatOrderDate(order.payment.createdAt)}
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

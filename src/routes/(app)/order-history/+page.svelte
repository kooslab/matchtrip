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

</script>

<svelte:head>
	<title>주문 내역 - MatchTrip</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">주문 내역</h1>
		<p class="mt-2 text-gray-600">결제 완료된 여행 내역을 확인하세요</p>
	</div>

	{#if orders.length === 0}
		<!-- Empty State -->
		<div class="rounded-lg border border-gray-200 bg-white p-12 text-center">
			<div class="mb-4 text-6xl">🛒</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">아직 주문 내역이 없습니다</h3>
			<p class="mb-6 text-gray-600">여행 제안을 수락하고 결제를 완료하면 여기에 표시됩니다</p>
			<button
				onclick={() => goto('/trips')}
				class="rounded-lg bg-pink-500 px-6 py-2 text-white hover:bg-pink-600">
				여행 둘러보기
			</button>
		</div>
	{:else}
		<!-- Order List -->
		<div class="space-y-4">
			{#each orders as order}
				<div 
					class="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow cursor-pointer"
					onclick={() => goto(`/order-history/details?id=${order.payment.id}`)}>
					<div class="flex items-center justify-between">
						<!-- Left side - Order info -->
						<div class="flex-1">
							<div class="flex items-center gap-4">
								<div>
									<h3 class="font-medium text-gray-900">
										{order.destination?.city || '알 수 없는 도시'}
									</h3>
									<p class="text-sm text-gray-500">
										{formatDateRange(order.startDate, order.endDate, { locale: $userLocale, timezone: $userTimezone, format: 'long' })}
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
							<p class="font-semibold text-gray-900">
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
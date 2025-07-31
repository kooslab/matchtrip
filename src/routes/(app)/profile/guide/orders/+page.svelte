<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, Calendar, Users, CreditCard } from 'lucide-svelte';
	import { formatDate } from '$lib/utils/dateFormatter';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';

	const { data } = $props();
	const orders = $derived(data.orders || []);

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
</script>

<div class="min-h-screen bg-gray-50 pb-24">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-100 bg-white">
		<div class="flex h-14 items-center px-4">
			<button onclick={() => window.history.back()} class="-ml-2 p-2">
				<ChevronLeft class="h-5 w-5" />
			</button>
			<h1 class="ml-2 text-lg font-semibold">주문 상세</h1>
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
					<button
						onclick={() => goto(`/profile/guide/orders/${order.offer.id}`)}
						class="w-full rounded-lg bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
					>
						<!-- Order Date -->
						<div class="mb-2 text-sm text-gray-500">
							{formatDate(order.payment?.createdAt || order.offer.createdAt)}
						</div>

						<!-- Payment Status Badge -->
						<div class="mb-3">
							<span
								class={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
									order.payment?.status === 'completed'
										? 'bg-green-100 text-green-800'
										: order.payment?.status === 'cancelled' || order.payment?.status === 'refunded'
											? 'bg-red-100 text-red-800'
											: 'bg-gray-100 text-gray-800'
								}`}
							>
								{getPaymentStatusText(order.payment?.status)}
							</span>
						</div>

						<!-- Trip Title -->
						<h3 class="mb-2 font-semibold text-gray-900">{order.offer.title}</h3>

						<!-- Trip Info -->
						<div class="mb-3 space-y-1 text-sm text-gray-600">
							<div class="flex items-center gap-2">
								<Calendar class="h-4 w-4" />
								<span>{formatDate(order.trip.startDate)} - {formatDate(order.trip.endDate)}</span>
							</div>
							<div class="flex items-center gap-2">
								<Users class="h-4 w-4" />
								<span
									>성인 {order.trip.adultsCount}명{order.trip.childrenCount > 0
										? `, 아동 ${order.trip.childrenCount}명`
										: ''}</span
								>
							</div>
						</div>

						<!-- Traveler Info -->
						<div class="border-t border-gray-100 pt-3">
							<p class="text-sm text-gray-600">주문자 정보</p>
							<p class="font-medium">{order.traveler.name}</p>
						</div>

						<!-- Payment Info -->
						{#if order.payment}
							<div class="mt-3 border-t border-gray-100 pt-3">
								<div class="flex items-center justify-between">
									<span class="text-sm text-gray-600">총 결제금액</span>
									<span class="text-lg font-semibold">{formatPrice(order.payment.amount)}원</span>
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

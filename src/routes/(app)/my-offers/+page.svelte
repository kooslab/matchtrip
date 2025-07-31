<script lang="ts">
	import { goto } from '$app/navigation';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import CalendarIcon from '$lib/icons/icon-calendar-check-mono.svg';
	import UserIcon from '$lib/icons/icon-user-two-mono.svg';

	let { data } = $props();

	let offers = $derived(data.offers);
	let totalOffers = $derived(data.totalOffers);

	// Tab state
	let activeTab = $state('all');

	// Filter offers based on active tab
	let filteredOffers = $derived(() => {
		const allOffers = [...offers.pending, ...offers.accepted, ...offers.rejected];

		switch (activeTab) {
			case 'all':
				return allOffers;
			case 'pending':
				return offers.pending;
			case 'accepted':
				return offers.accepted;
			case 'rejected':
				return offers.rejected;
			default:
				return allOffers;
		}
	});

	function formatPrice(price: number) {
		return price.toLocaleString('ko-KR');
	}

	function formatDate(date: Date | string) {
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}. ${month}. ${day}`;
	}

	function formatDateRange(startDate: Date | string, endDate: Date | string) {
		return `${formatDate(startDate)} - ${formatDate(endDate)}`;
	}

	function getDaysRemaining(startDate: Date | string, endDate: Date | string) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		return `${duration - 1}박 ${duration}일`;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'pending':
				return { text: '대기 상태', class: 'bg-gray-100 text-gray-600' };
			case 'accepted':
				return { text: '결제 완료', class: 'bg-green-100 text-green-600' };
			case 'rejected':
				return { text: '거절됨', class: 'bg-red-100 text-red-600' };
			default:
				return { text: status, class: 'bg-gray-100 text-gray-600' };
		}
	}
</script>

<svelte:head>
	<title>나의 제안 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header -->
		<header class="sticky top-0 z-50 border-b border-gray-200 bg-white">
			<div class="flex items-center px-4 py-4">
				<button onclick={() => window.history.back()} class="-ml-2 p-2">
					<ArrowLeft class="h-5 w-5 text-gray-700" />
				</button>
				<h1 class="flex-1 text-center text-lg font-semibold">나의 제안</h1>
				<div class="w-9"></div>
				<!-- Spacer for centering -->
			</div>
		</header>

		<!-- Tab Navigation -->
		<div class="sticky top-[57px] z-40 border-b border-gray-200 bg-white">
			<div class="flex">
				<button
					onclick={() => (activeTab = 'all')}
					class="relative flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
					'all'
						? 'border-b-2 border-gray-900 text-gray-900'
						: 'text-gray-500'}"
				>
					<span class="flex items-center justify-center gap-1.5">
						전체
						<span
							class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium {activeTab ===
							'all'
								? 'bg-green-500 text-white'
								: 'bg-gray-200 text-gray-600'}"
						>
							{totalOffers}
						</span>
					</span>
				</button>
				<button
					onclick={() => (activeTab = 'pending')}
					class="relative flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
					'pending'
						? 'border-b-2 border-gray-900 text-gray-900'
						: 'text-gray-500'}"
				>
					<span class="flex items-center justify-center gap-1.5">
						진행
						<span
							class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium {activeTab ===
							'pending'
								? 'bg-green-500 text-white'
								: 'bg-gray-200 text-gray-600'}"
						>
							{offers.pending.length}
						</span>
					</span>
				</button>
				<button
					onclick={() => (activeTab = 'accepted')}
					class="relative flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
					'accepted'
						? 'border-b-2 border-gray-900 text-gray-900'
						: 'text-gray-500'}"
				>
					<span class="flex items-center justify-center gap-1.5">
						결제
						<span
							class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium {activeTab ===
							'accepted'
								? 'bg-green-500 text-white'
								: 'bg-gray-200 text-gray-600'}"
						>
							{offers.accepted.length}
						</span>
					</span>
				</button>
				<button
					onclick={() => (activeTab = 'rejected')}
					class="relative flex-1 px-4 py-3 text-sm font-medium transition-colors {activeTab ===
					'rejected'
						? 'border-b-2 border-gray-900 text-gray-900'
						: 'text-gray-500'}"
				>
					<span class="flex items-center justify-center gap-1.5">
						취소
						<span
							class="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium {activeTab ===
							'rejected'
								? 'bg-green-500 text-white'
								: 'bg-gray-200 text-gray-600'}"
						>
							{offers.rejected.length}
						</span>
					</span>
				</button>
			</div>
		</div>

		<!-- Main Content -->
		<main class="pb-24">
			{#if filteredOffers().length === 0}
				<div class="flex flex-col items-center justify-center px-4 py-32">
					<div class="mb-4 h-24 w-24 text-gray-300">
						<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="1.5"
								d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
							/>
						</svg>
					</div>
					<h3 class="mb-2 text-lg font-medium text-gray-900">제안한 여행이 없습니다</h3>
					<p class="text-center text-sm text-gray-500">
						{#if activeTab === 'pending'}
							진행 중인 제안이 없습니다
						{:else if activeTab === 'accepted'}
							결제 완료된 제안이 없습니다
						{:else if activeTab === 'rejected'}
							취소된 제안이 없습니다
						{:else}
							아직 제안한 여행이 없습니다
						{/if}
					</p>
					{#if activeTab === 'all'}
						<button
							onclick={() => goto('/trips')}
							class="mt-4 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
						>
							여행 찾아보기
						</button>
					{/if}
				</div>
			{:else}
				<div class="space-y-4 p-4">
					{#each filteredOffers() as offer}
						{@const statusBadge = getStatusBadge(offer.status)}
						<button
							onclick={() => {
								if (offer.status === 'accepted' && offer.paymentOrderId) {
									// For accepted offers with payment, go to order confirmation
									goto(`/order-confirmation/${offer.paymentOrderId}`);
								} else {
									// For other cases, go to offer detail
									goto(`/my-offers/${offer.id}`);
								}
							}}
							class="w-full cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white text-left transition-shadow hover:shadow-md"
						>
							<!-- Status Badge -->
							<div class="px-4 pt-4">
								<span
									class="inline-flex items-center rounded px-2.5 py-0.5 text-xs font-medium {statusBadge.class}"
								>
									{statusBadge.text}
								</span>
							</div>

							<!-- Offer Info -->
							<div class="px-4 py-3">
								<h3 class="mb-2 font-semibold text-gray-900">
									{offer.destination.city}, {offer.country.name}
								</h3>

								<div class="mb-3 space-y-2">
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<img src={CalendarIcon} alt="" class="h-4 w-4" />
										<span class="rounded bg-gray-100 px-2 py-1 text-xs">
											{formatDateRange(offer.trip.startDate, offer.trip.endDate)}
											{getDaysRemaining(offer.trip.startDate, offer.trip.endDate)}
										</span>
									</div>
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<img src={UserIcon} alt="" class="h-4 w-4" />
										<span
											>성인 {offer.trip.adultsCount}명{offer.trip.childrenCount > 0
												? `, 아동 ${offer.trip.childrenCount}명`
												: ''}</span
										>
									</div>
								</div>

								<div class="mb-3">
									<span class="text-sm text-blue-600">
										{offer.traveler.name}님의 여행 · 가이드 지원도착
									</span>
								</div>

								<div class="border-t border-gray-100 pt-3">
									<div class="rounded-lg bg-gray-50 p-3">
										<div class="mb-1 text-xs text-gray-500">{formatDate(offer.createdAt)} 예상</div>
										<div class="text-lg font-bold text-gray-900">{formatPrice(offer.price)}원</div>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</main>

		<!-- Bottom Navigation -->
		<GuideBottomNav />
	</div>
</div>

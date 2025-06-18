<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';
	
	let { data } = $props();

	let trips = $derived(data.trips);

	// Loading state for proposal navigation
	let navigatingTripId = $state<string | null>(null);

	function formatTripDate(date: Date | string) {
		return formatDate(date, {
			locale: $userLocale,
			timezone: $userTimezone,
			format: 'long'
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

	async function goToOffer(tripId: string) {
		navigatingTripId = tripId;
		try {
			await goto(`/offers?tripId=${tripId}`);
		} finally {
			navigatingTripId = null;
		}
	}
</script>

<svelte:head>
	<title>여행찾기 - MatchTrip</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-gray-900">여행찾기</h1>
		<p class="text-gray-600">가이드할 수 있는 여행을 찾아보세요</p>
	</div>

	{#if trips.length === 0}
		<div class="py-12 text-center">
			<div class="mx-auto mb-4 h-24 w-24 text-gray-400">
				<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">현재 이용 가능한 여행이 없습니다</h3>
			<p class="text-gray-500">새로운 여행 요청이 들어오면 알려드릴게요!</p>
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each trips as trip}
				<div
					class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-md transition-shadow hover:shadow-lg">
					<div class="p-6">
						<div class="mb-4 flex items-start justify-between">
							<div>
								<h3 class="mb-1 text-lg font-semibold text-gray-900">
									{trip.destination.city}, {trip.destination.country}
								</h3>
								<p class="text-sm text-gray-500">
									{trip.traveler.name}님의 여행
								</p>
							</div>
							<span
								class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
								{trip.status === 'submitted' ? '제안 기다리는 중' : trip.status}
							</span>
						</div>

						<div class="mb-4 space-y-1">
							<p class="text-sm text-gray-600">
								📅 {formatDateRange(trip.startDate, trip.endDate, { locale: $userLocale, timezone: $userTimezone, format: 'long' })}
							</p>

							<p class="text-sm text-gray-600">
								👥 성인 {trip.adultsCount}명
								{#if trip.childrenCount > 0}
									, 아동 {trip.childrenCount}명
								{/if}
							</p>

							<p class="text-sm text-gray-600">
								🚶 {formatTravelMethod(trip.travelMethod)}
							</p>
						</div>

						{#if trip.customRequest}
							<div class="mb-4">
								<h4 class="mb-1 text-sm font-medium text-gray-900">특별 요청사항</h4>
								<p class="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
									{trip.customRequest}
								</p>
							</div>
						{/if}

						<div class="border-t border-gray-100 pt-4">
							<div class="mb-2 flex items-center justify-between">
								<span class="text-xs text-gray-500">
									{formatTripDate(trip.createdAt)} 등록
								</span>
								{#if trip.hasOffer}
									<div class="flex items-center gap-2">
										<span
											class="inline-flex items-center rounded-md bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
											내가 제안함
										</span>
										{#if trip.conversationId}
											<a
												href="/conversations/{trip.conversationId}"
												class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none">
												<svg class="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
												</svg>
												대화
											</a>
										{/if}
									</div>
								{:else}
									<button
										onclick={() => goToOffer(trip.id)}
										disabled={navigatingTripId === trip.id}
										class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50">
										{#if navigatingTripId === trip.id}
											<div
												class="mr-1 h-3 w-3 animate-spin rounded-full border border-white border-t-transparent">
											</div>
											로딩중...
										{:else}
											제안하기
										{/if}
									</button>
								{/if}
							</div>

							{#if trip.hasOffer && trip.offerPrice}
								<div class="mt-2 rounded-md bg-green-50 p-3">
									<div class="flex items-center justify-between">
										<div>
											<p class="text-sm font-medium text-green-800">내 제안 금액</p>
											<p class="text-lg font-bold text-green-900">
												{trip.offerPrice.toLocaleString('ko-KR')}원
											</p>
										</div>
										<div class="text-right">
											<p class="text-xs text-green-600">상태</p>
											<span
												class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium
												{trip.offerStatus === 'pending'
													? 'bg-yellow-100 text-yellow-800'
													: trip.offerStatus === 'accepted'
														? 'bg-green-100 text-green-800'
														: trip.offerStatus === 'rejected'
															? 'bg-red-100 text-red-800'
															: 'bg-gray-100 text-gray-800'}">
												{trip.offerStatus === 'pending'
													? '검토중'
													: trip.offerStatus === 'accepted'
														? '수락됨'
														: trip.offerStatus === 'rejected'
															? '거절됨'
															: trip.offerStatus}
											</span>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
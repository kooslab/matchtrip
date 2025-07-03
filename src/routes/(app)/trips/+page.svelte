<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';
	import calendarIconUrl from '$lib/icons/icon-calendar-check-mono.svg';
	import usersIconUrl from '$lib/icons/icon-user-two-mono.svg';
	import bookmarkIconUrl from '$lib/icons/icon-bookmark-mono.svg';
	import arrowDownIconUrl from '$lib/icons/icon-arrow-up-limit-mono.svg';
	import checkIconUrl from '$lib/icons/icon-check-circle-mono.svg';
	import chevronRightIconUrl from '$lib/icons/icon-arrow-right-small-mono.svg';

	let { data } = $props();

	let trips = $derived(data.trips);
	let userRole = $derived(data.userRole);

	// Loading state for proposal navigation
	let navigatingTripId = $state<string | null>(null);

	// Filter states
	let selectedFilters = $state({
		destination: false,
		dates: false,
		people: false,
		budget: false
	});

	// Get unique destinations count
	let uniqueDestinations = $derived(
		new Set(trips.map((trip) => `${trip.destination.city}, ${trip.destination.country}`)).size
	);

	// Get status display info
	function getStatusInfo(status: string) {
		switch (status) {
			case 'submitted':
				return { label: '제안중', class: 'bg-blue-500 text-white' };
			case 'accepted':
				return { label: '진행중', class: 'bg-green-500 text-white' };
			case 'completed':
				return { label: '완료됨', class: 'bg-gray-500 text-white' };
			case 'cancelled':
				return { label: '취소됨', class: 'bg-red-500 text-white' };
			default:
				return { label: status, class: 'bg-gray-500 text-white' };
		}
	}

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

<div class="min-h-screen bg-gray-50">
	<!-- Filter Bar -->
	<div class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="container mx-auto px-4 py-3">
			<div class="scrollbar-hide flex gap-2 overflow-x-auto">
				<button
					onclick={() => (selectedFilters.destination = !selectedFilters.destination)}
					class="flex flex-shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all {selectedFilters.destination
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span>여행지 {uniqueDestinations > 0 ? `${uniqueDestinations}곳` : ''}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-4 w-4 {selectedFilters.destination ? 'brightness-0 invert' : ''}"
					/>
				</button>
				<button
					onclick={() => (selectedFilters.dates = !selectedFilters.dates)}
					class="flex flex-shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all {selectedFilters.dates
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span>일정</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-4 w-4 {selectedFilters.dates ? 'brightness-0 invert' : ''}"
					/>
				</button>
				<button
					onclick={() => (selectedFilters.people = !selectedFilters.people)}
					class="flex flex-shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all {selectedFilters.people
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span>인원</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-4 w-4 {selectedFilters.people ? 'brightness-0 invert' : ''}"
					/>
				</button>
				<button
					onclick={() => (selectedFilters.budget = !selectedFilters.budget)}
					class="flex flex-shrink-0 items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-all {selectedFilters.budget
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span>예산</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-4 w-4 {selectedFilters.budget ? 'brightness-0 invert' : ''}"
					/>
				</button>
			</div>
		</div>
	</div>

	<div class="container mx-auto px-4 py-6">
		<div class="mb-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-2xl font-bold text-gray-900">전체</span>
					<span class="text-2xl font-bold text-blue-600">{trips.length}</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<img src={checkIconUrl} alt="Check" class="h-4 w-4" />
						<span>완료된 여행 제외</span>
					</div>
					<button
						class="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						최신순
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>
				</div>
			</div>
		</div>

		{#if trips.length === 0}
			<div class="py-12 text-center">
				<div class="mx-auto mb-4 h-24 w-24 text-gray-400">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">
					{#if userRole === 'guide'}
						현재 가이드할 수 있는 여행이 없습니다
					{:else}
						현재 이용 가능한 여행이 없습니다
					{/if}
				</h3>
				<p class="text-gray-500">
					{#if userRole === 'guide'}
						새로운 여행 요청이 들어오면 알려드릴게요!
					{:else}
						곧 새로운 여행이 등록될 예정입니다.
					{/if}
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each trips as trip}
					<div
						onclick={() => goto(`/trips/${trip.id}`)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								goto(`/trips/${trip.id}`);
							}
						}}
						class="w-full cursor-pointer overflow-hidden rounded-lg bg-white text-left shadow-sm transition-shadow hover:shadow-md"
					>
						<div class="p-4">
							<div class="mb-3 flex items-start justify-between">
								<div class="flex-1">
									<div class="mb-1 flex items-center gap-2">
										<span
											class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {getStatusInfo(
												trip.status
											).class}"
										>
											{getStatusInfo(trip.status).label}
										</span>
									</div>
									<h3 class="mb-2 text-base font-semibold text-gray-900">
										{trip.destination.city}, {trip.destination.country}
									</h3>
								</div>
								<button
									onclick={(e) => e.stopPropagation()}
									class="text-gray-400 transition-colors hover:text-gray-600"
								>
									<img src={bookmarkIconUrl} alt="Bookmark" class="h-5 w-5" />
								</button>
							</div>

							<div class="mb-3 space-y-1">
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg
										class="h-4 w-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									<span
										>{formatDateRange(trip.startDate, trip.endDate, {
											locale: $userLocale,
											timezone: $userTimezone,
											format: 'short'
										})}</span
									>
								</div>

								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg
										class="h-4 w-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
										/>
									</svg>
									<span
										>성인 {trip.adultsCount}명{#if trip.childrenCount > 0}
											아동 {trip.childrenCount}명{/if}</span
									>
								</div>
							</div>

							<div class="-mx-4 mb-4 px-4">
								<div class="scrollbar-hide flex gap-2 overflow-x-auto">
									<span
										class="inline-flex flex-shrink-0 items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
									>
										200~500만원
									</span>
									<span
										class="inline-flex flex-shrink-0 items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
									>
										{formatTravelMethod(trip.travelMethod)}
									</span>
									<span
										class="inline-flex flex-shrink-0 items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
									>
										자연 / 아웃도어
									</span>
								</div>
							</div>

							<div class="border-t border-gray-100 pt-4">
								<details class="group">
									<summary
										class="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900"
									>
										요청 사항
										<svg
											class="h-5 w-5 transition-transform group-open:rotate-180"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7"
											/>
										</svg>
									</summary>
									<div class="mt-3 space-y-3">
										{#if trip.customRequest}
											<div class="text-sm text-gray-600">
												{trip.customRequest}
											</div>
										{:else}
											<div class="text-sm text-gray-500">특별한 요청사항이 없습니다.</div>
										{/if}

										<div class="flex items-center justify-between border-t border-gray-100 pt-3">
											<div class="text-sm">
												<span class="text-gray-500">남은 기간</span>
												<span class="ml-2 font-medium text-gray-900">7일</span>
											</div>
										</div>

										<div class="grid grid-cols-2 gap-3 pt-3">
											<div>
												<p class="mb-2 text-xs text-gray-500">자세히 보기</p>
												<button
													onclick={(e) => {
														e.stopPropagation();
														goto(`/trips/${trip.id}`);
													}}
													class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
												>
													자세히 보기
												</button>
											</div>
											<div>
												{#if trip.hasOffer}
													<p class="mb-2 text-xs text-gray-500">지원한 보기</p>
													<button
														onclick={(e) => {
															e.stopPropagation();
															goto(`/conversations/${trip.conversationId}`);
														}}
														class="w-full rounded-lg bg-[#2B2D5B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2147]"
													>
														제안하기
													</button>
												{:else}
													<p class="mb-2 text-xs text-gray-500">&nbsp;</p>
													<button
														onclick={(e) => {
															e.stopPropagation();
															goToOffer(trip.id);
														}}
														disabled={navigatingTripId === trip.id}
														class="w-full rounded-lg bg-[#2B2D5B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2147] disabled:cursor-not-allowed disabled:opacity-50"
													>
														{#if navigatingTripId === trip.id}
															로딩중...
														{:else}
															제안하기
														{/if}
													</button>
												{/if}
											</div>
										</div>
									</div>
								</details>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}
</style>

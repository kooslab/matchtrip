<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatKoreanDate, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import arrowRightUrl from '$lib/icons/icon-arrow-right-small-mono.svg';

	let { data } = $props();
	let trip = $derived(data.trip);
	let hasExistingOffer = $derived(data.hasExistingOffer);

	let isTravelInfoOpen = $state(false);
	let isCustomRequestOpen = $state(false);
	let isFilesOpen = $state(false);

	// Calculate nights and days
	function calculateNightsAndDays(startDate: Date | string, endDate: Date | string) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const days = nights + 1;
		return `${nights}박 ${days}일`;
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

	function getStatusText(status: string) {
		const statusMap: Record<string, string> = {
			draft: '임시저장',
			submitted: '제출됨',
			accepted: '수락됨',
			completed: '완료됨',
			cancelled: '취소됨'
		};
		return statusMap[status] || status;
	}

	function handleMakeOffer() {
		// Navigate to create offer page with tripId
		goto(`/offers/create?tripId=${trip.id}`);
	}

	function handleViewOffer() {
		// Navigate to guide's offer details
		goto(`/my-offers`);
	}
</script>

<svelte:head>
	<title>{trip.destination?.city || '여행'} - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="flex h-14 items-center px-4">
			<button onclick={() => goto('/trips')} class="mr-4">
				<img src={arrowLeftUrl} alt="Back" class="h-6 w-6" />
			</button>
			<h1 class="text-lg font-semibold text-gray-900">
				{trip.destination?.city || '목적지'}, {trip.destination?.country || ''}
			</h1>
		</div>
	</header>

	<!-- Content -->
	<div class="px-4 py-6 pb-24">
		<!-- Trip Summary -->
		<div class="mb-6">
			<h2 class="mb-1 text-sm font-medium text-gray-600">여행 정보</h2>
			<h3 class="mb-4 text-2xl font-bold text-gray-900">
				200 ~500 만원 <span class="text-sm font-normal text-gray-500">예산 범위</span>
			</h3>

			<div class="space-y-2">
				<div class="flex items-center text-sm">
					<span class="w-16 text-gray-600">여행 상태</span>
					<span
						class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700"
					>
						{getStatusText(trip.status)}
					</span>
				</div>
				<div class="flex items-center text-sm">
					<span class="w-16 text-gray-600">여행 일정</span>
					<span class="text-gray-900"
						>{formatKoreanDateRange(trip.startDate, trip.endDate)}
						{calculateNightsAndDays(trip.startDate, trip.endDate)}</span
					>
				</div>
				<div class="flex items-center text-sm">
					<span class="w-16 text-gray-600">인원</span>
					<span class="text-gray-900"
						>성인 {trip.adultsCount}명{trip.childrenCount > 0
							? `, 아동 ${trip.childrenCount}명`
							: ''}</span
					>
				</div>
				<div class="flex items-center text-sm">
					<span class="w-16 text-gray-600">여행 스타일</span>
					<span class="text-gray-900"
						>{trip.travelMethod ? formatTravelMethod(trip.travelMethod) : '모험적인 여행'}</span
					>
				</div>
				<div class="flex items-center text-sm">
					<span class="w-16 text-gray-600">관심 활동</span>
					<span class="text-gray-900">자연 / 아웃도어</span>
				</div>
			</div>
		</div>

		<!-- Collapsible Sections -->
		<!-- Custom Request Section -->
		<div class="mb-4 rounded-lg bg-white">
			<button
				onclick={() => (isCustomRequestOpen = !isCustomRequestOpen)}
				class="flex w-full items-center justify-between px-4 py-3"
			>
				<span class="text-sm font-medium text-gray-900">요청 사항</span>
				<img
					src={arrowRightUrl}
					alt={isCustomRequestOpen ? 'Close' : 'Open'}
					class="h-5 w-5 transition-transform {isCustomRequestOpen ? '-rotate-90' : 'rotate-90'}"
				/>
			</button>
			{#if isCustomRequestOpen}
				<div class="border-t border-gray-100 px-4 pb-4">
					<p class="mt-3 text-sm text-gray-600">
						{trip.customRequest ||
							"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s."}
					</p>
				</div>
			{/if}
		</div>

		<!-- Files Section -->
		<div class="mb-6 rounded-lg bg-white">
			<button
				onclick={() => (isFilesOpen = !isFilesOpen)}
				class="flex w-full items-center justify-between px-4 py-3"
			>
				<span class="text-sm font-medium text-gray-900">첨부 파일</span>
				<img
					src={arrowRightUrl}
					alt={isFilesOpen ? 'Close' : 'Open'}
					class="h-5 w-5 transition-transform {isFilesOpen ? '-rotate-90' : 'rotate-90'}"
				/>
			</button>
			{#if isFilesOpen}
				<div class="border-t border-gray-100 px-4 pb-4">
					<div class="mt-3 flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
							<span class="text-xs font-semibold text-red-600">PDF</span>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">여행계획표.pdf</p>
							<p class="text-xs text-gray-500">2MB</p>
						</div>
						<button class="text-gray-400">
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- What is Lorem Ipsum Section -->
		<div class="rounded-lg bg-blue-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-blue-900">What is Lorem Ipsum</h3>
			<p class="text-xs text-blue-700">
				Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
				been the industry's standard dummy text ever since the 1500s.
			</p>
			<button class="mt-3 flex items-center gap-1 text-sm font-medium text-blue-600">
				Go detail
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Bottom Buttons -->
	<div class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white">
		<div class="px-4 py-3">
			{#if hasExistingOffer}
				<button
					onclick={handleViewOffer}
					class="w-full rounded-lg bg-gray-500 py-3 font-medium text-white"
				>
					이미 제안함
				</button>
			{:else}
				<button
					onclick={handleMakeOffer}
					class="w-full rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700"
				>
					제안하기
				</button>
			{/if}
		</div>
	</div>
</div>

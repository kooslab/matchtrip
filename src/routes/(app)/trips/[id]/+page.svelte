<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatKoreanDate, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import { colors } from '$lib/constants/colors';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import arrowRightUrl from '$lib/icons/icon-arrow-right-small-mono.svg';

	let { data } = $props();
	let trip = $derived(data.trip);
	console.log('trip', trip);
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

	function formatActivity(activityId: string) {
		const activityMap: Record<string, string> = {
			'city-tour': '시내투어',
			'suburb-tour': '근교투어',
			'snap-photo': '스냅사진',
			'vehicle-tour': '차량투어',
			'airport-pickup': '공항픽업',
			'bus-charter': '버스대절',
			interpretation: '통역 서비스',
			accommodation: '숙박(민박)',
			'organization-visit': '기관방문',
			'other-tour': '기타투어'
		};

		return activityMap[activityId] || activityId;
	}

	function formatTravelStyle(style: string | null) {
		if (!style) return '미정';

		// Trip creation travel styles
		const tripCreationStyles: Record<string, string> = {
			friends: '친구들과 함께 하는 여행',
			parents: '부모님과 함께 하는 여행',
			children: '가족과 함께하는 여행자녀와 함께',
			business: '직장동료와 함께하는 비즈니스 여행',
			other: '기타여행'
		};

		// Trip edit travel styles
		const tripEditStyles: Record<string, string> = {
			relaxation: '휴양/힐링',
			adventure: '모험/액티비티',
			culture: '문화/역사',
			food: '미식/요리',
			shopping: '쇼핑',
			nature: '자연/생태',
			city: '도시 탐방',
			family: '가족 여행'
		};

		// Check both style maps
		return tripCreationStyles[style] || tripEditStyles[style] || style;
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
		// Navigate to the first step of the new offer creation flow
		goto(`/offers/create/trip-info?tripId=${trip.id}`);
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
	<header class="sticky top-0 z-10 bg-white shadow-sm">
		<div class="flex h-14 items-center justify-between px-4">
			<div class="flex items-center">
				<button
					onclick={() => goto('/trips')}
					class="mr-3 -ml-2 rounded-lg p-2 transition-colors hover:bg-gray-100">
					<img src={arrowLeftUrl} alt="Back" class="h-5 w-5" />
				</button>
				<h1 class="text-lg font-semibold text-gray-900">
					{trip.destination?.city || '목적지'}{trip.country?.name ? `, ${trip.country.name}` : ''}
				</h1>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="container mx-auto max-w-3xl px-4 py-6 pb-20">
		<!-- Trip Summary Card -->
		<div class="mb-6 rounded-lg bg-white p-5 shadow-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-semibold text-gray-900">여행 정보</h2>
				<span
					class="{trip.status === 'submitted'
						? 'bg-blue-100 text-blue-700'
						: trip.status === 'accepted'
							? 'bg-green-100 text-green-700'
							: trip.status === 'completed'
								? 'bg-gray-100 text-gray-700'
								: 'bg-yellow-100 text-yellow-700'} inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium">
					{getStatusText(trip.status)}
				</span>
			</div>
			<div class="mb-5">
				<p class="mb-1 text-sm text-gray-600">예산</p>
				<p class="text-2xl font-bold text-gray-900">
					{trip.budgetMin ? `${(trip.budgetMin / 10000).toLocaleString()}` : '0'} ~ {trip.budgetMax
						? `${(trip.budgetMax / 10000).toLocaleString()}`
						: '0'}만원
				</p>
			</div>

			<div class="space-y-3">
				<div class="flex items-start">
					<span class="w-20 flex-shrink-0 text-sm text-gray-600">일정</span>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">
							{formatKoreanDateRange(trip.startDate, trip.endDate)}
						</p>
						<p class="text-sm text-gray-600">
							{calculateNightsAndDays(trip.startDate, trip.endDate)}
						</p>
					</div>
				</div>
				<div class="flex items-start">
					<span class="w-20 flex-shrink-0 text-sm text-gray-600">인원</span>
					<p class="text-sm font-medium text-gray-900">
						성인 {trip.adultsCount}명{trip.childrenCount > 0
							? `, 아동 ${trip.childrenCount}명`
							: ''}
					</p>
				</div>
				<div class="flex items-start">
					<span class="w-20 flex-shrink-0 text-sm text-gray-600">이동수단</span>
					<p class="text-sm font-medium text-gray-900">
						{trip.travelMethod ? formatTravelMethod(trip.travelMethod) : '미정'}
					</p>
				</div>
				{#if trip.activities && trip.activities.length > 0}
					<div class="flex items-start">
						<span class="w-20 flex-shrink-0 text-sm text-gray-600">활동</span>
						<div class="flex flex-wrap gap-1.5">
							{#each trip.activities as activity}
								<span class="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
									{formatActivity(activity)}
								</span>
							{/each}
						</div>
					</div>
				{/if}
				{#if trip.travelStyle}
					<div class="flex items-start">
						<span class="w-20 flex-shrink-0 text-sm text-gray-600">여행 스타일</span>
						<p class="text-sm font-medium text-gray-900">
							{formatTravelStyle(trip.travelStyle)}
						</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- Collapsible Sections -->
		<!-- Custom Request Section -->
		<div class="mb-4 rounded-lg bg-white">
			<button
				onclick={() => (isCustomRequestOpen = !isCustomRequestOpen)}
				class="flex w-full items-center justify-between px-4 py-3">
				<span class="text-sm font-medium text-gray-900">요청 사항</span>
				<img
					src={arrowRightUrl}
					alt={isCustomRequestOpen ? 'Close' : 'Open'}
					class="h-5 w-5 transition-transform {isCustomRequestOpen ? 'rotate-90' : ''}" />
			</button>
			{#if isCustomRequestOpen}
				<div class="border-t border-gray-100 px-4 pb-4">
					<p class="mt-3 text-sm text-gray-600">
						{trip.additionalRequest || '요청 사항이 없습니다.'}
					</p>
				</div>
			{/if}
		</div>

		<!-- Files Section -->
		<div class="mb-6 overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-200">
			<button
				onclick={() => (isFilesOpen = !isFilesOpen)}
				class="flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50">
				<span class="text-base font-medium text-gray-900">첨부 파일</span>
				<img
					src={arrowRightUrl}
					alt={isFilesOpen ? 'Close' : 'Open'}
					class="h-5 w-5 transition-transform duration-200 {isFilesOpen ? 'rotate-90' : '0'}" />
			</button>
			{#if isFilesOpen}
				<div class="border-t border-gray-100 px-4 pb-4">
					{#if trip.attachments && trip.attachments.length > 0}
						<div class="mt-3 space-y-3">
							{#each trip.attachments as file}
								<div
									class="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
									<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
										<span class="text-xs font-semibold text-red-600">PDF</span>
									</div>
									<div class="flex-1">
										<p class="text-sm font-medium text-gray-900">{file.name}</p>
										<p class="text-xs text-gray-500">{file.size}</p>
									</div>
									<button
										class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="mt-3 text-sm text-gray-500">첨부된 파일이 없습니다.</p>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Info Section -->
		{#if trip.additionalInfo}
			<div class="rounded-lg bg-blue-50 p-5">
				<h3 class="mb-2 text-base font-semibold text-blue-900">추가 정보</h3>
				<p class="text-sm leading-relaxed text-blue-800">
					{trip.additionalInfo}
				</p>
			</div>
		{/if}
	</div>

	<!-- Bottom Buttons -->
	<div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
		<div class="px-4 py-4">
			{#if hasExistingOffer}
				<button
					onclick={handleViewOffer}
					class="w-full rounded-lg bg-gray-500 py-3.5 text-base font-semibold text-white transition-all hover:bg-gray-600">
					이미 제안함
				</button>
			{:else}
				<button
					onclick={handleMakeOffer}
					class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all active:scale-[0.98]"
					style="background-color: {colors.primary}"
					onmouseover={(e) => (e.currentTarget.style.backgroundColor = colors.primaryHover)}
					onmouseout={(e) => (e.currentTarget.style.backgroundColor = colors.primary)}>
					제안하기
				</button>
			{/if}
		</div>
	</div>
</div>

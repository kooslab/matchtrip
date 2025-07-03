<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession } from '$lib/authClient';
	import { invalidate } from '$app/navigation';
	import { formatDate, formatDateRange, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';
	import flightIconUrl from '$lib/icons/icon-flight-mono.svg';
	import calendarIconUrl from '$lib/icons/icon-calendar-check-mono.svg';
	import userIconUrl from '$lib/icons/icon-user-two-mono.svg';

	// Get data from server load function
	let { data } = $props();

	// Authentication check
	const session = useSession();

	// Check if user is authenticated, redirect to signin if not
	$effect(() => {
		if (!$session.isPending && !$session.data) {
			goto('/signin');
		}
	});

	// Get trips from server data
	let trips = $derived(data.trips || []);
	let serverError = $derived(data.error);

	// Loading state for detail navigation
	let navigatingTripId = $state<string | null>(null);

	// Refresh state
	let refreshing = $state(false);

	// Refresh trips data
	async function refreshTrips() {
		try {
			refreshing = true;
			// Invalidate the current page data to force a refresh
			await invalidate('app:trips');
		} catch (error) {
			console.error('Error refreshing trips:', error);
		} finally {
			refreshing = false;
		}
	}

	function formatTripDate(date: string | Date) {
		return formatDate(date, {
			locale: $userLocale,
			timezone: $userTimezone,
			format: 'medium'
		});
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

	function getStatusColor(status: string) {
		const colorMap: Record<string, string> = {
			draft: 'bg-gray-50 text-gray-700',
			submitted: 'bg-green-600 text-white',
			accepted: 'bg-blue-50 text-blue-700',
			completed: 'bg-purple-50 text-purple-700',
			cancelled: 'bg-red-50 text-red-700'
		};
		return colorMap[status] || 'bg-gray-50 text-gray-700';
	}

	function getTravelMethodText(method: string) {
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

	function goToCreateTrip() {
		goto('/new-trip');
	}

	async function goToTripDetails(tripId: string) {
		navigatingTripId = tripId;
		try {
			await goto(`/my-trips/${tripId}`);
		} finally {
			navigatingTripId = null;
		}
	}
</script>

{#if $session.isPending}
	<div class="flex min-h-screen items-center justify-center">
		<p class="text-lg text-gray-600">로딩 중...</p>
	</div>
{:else if !$session.data}
	<div class="flex min-h-screen items-center justify-center">
		<p class="text-lg text-gray-600">로그인이 필요합니다. 잠시 후 로그인 페이지로 이동합니다...</p>
	</div>
{:else}
	<div class="flex min-h-screen flex-col bg-white">
		<!-- Header -->
		<div class="border-b border-gray-200 bg-white px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-sm text-gray-900">
						전체 <span class="text-sm font-bold text-blue-600">{trips.length}</span>
					</span>
				</div>
				<button class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
					<span>최신순</span>
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

		<!-- Content -->
		<div class="flex-1 px-4 py-6">
			{#if refreshing}
				<div class="flex items-center justify-center py-12">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent"
					></div>
					<span class="ml-2 text-gray-600">여행 목록을 불러오는 중...</span>
				</div>
			{:else if serverError}
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="text-red-800">{serverError}</p>
					<button
						class="mt-2 text-sm text-red-600 underline hover:text-red-800"
						onclick={refreshTrips}
					>
						다시 시도
					</button>
				</div>
			{:else if trips.length === 0}
				<div class="flex flex-col items-center justify-center px-6 py-16">
					<!-- Icon Container -->
					<div class="mb-8 rounded-full bg-gray-50 p-8">
						<img src={flightIconUrl} alt="Flight" class="h-16 w-16 opacity-40" />
					</div>

					<!-- Text Content -->
					<h2 class="mb-3 text-xl font-semibold text-gray-900">아직 여행이 없어요</h2>
					<p class="mb-8 max-w-sm text-center text-base leading-relaxed text-gray-500">
						새로운 여행을 계획하고<br />
						현지 가이드의 특별한 제안을 받아보세요
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each trips as trip}
						<button
							onclick={() => goToTripDetails(trip.id)}
							class="w-full cursor-pointer overflow-hidden rounded-xl border border-gray-100 bg-white text-left transition-shadow hover:shadow-md"
						>
							<!-- Status Badge -->
							<div class="px-4 pt-4">
								<span
									class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium {getStatusColor(
										trip.status
									)}"
								>
									{getStatusText(trip.status)}
								</span>
							</div>

							<!-- Trip Info -->
							<div class="px-4 pb-4">
								<h3 class="mt-3 text-lg font-semibold text-gray-900">
									{trip.destination?.city || '목적지'}, {trip.destination?.country || ''}
								</h3>

								<!-- Date and Calendar Icon -->
								<div class="mt-2 flex items-center gap-2 text-sm text-gray-600">
									<img src={calendarIconUrl} alt="" class="h-4 w-4 opacity-60" />
									<span>{formatKoreanDateRange(trip.startDate, trip.endDate)}</span>
								</div>

								<!-- Participants -->
								<div class="mt-1 flex items-center gap-2 text-sm text-gray-600">
									<img src={userIconUrl} alt="" class="h-4 w-4 opacity-60" />
									<span
										>성인 {trip.adultsCount}명{trip.childrenCount > 0
											? `, 아동 ${trip.childrenCount}명`
											: ''}</span
									>
								</div>

								<!-- Price Range and Travel Details -->
								<div class="mt-3 flex flex-wrap items-center gap-3 text-sm">
									<span class="font-medium text-blue-600">
										{trip.minBudget
											? `${trip.minBudget}-${trip.maxBudget || trip.minBudget}만원`
											: '예산 미정'}
									</span>
									{#if trip.travelMethod}
										<span class="text-gray-500">{getTravelMethodText(trip.travelMethod)}</span>
									{/if}
									{#if trip.needsDriver}
										<span class="text-gray-500">차량 / 운전기사</span>
									{/if}
								</div>

								<!-- Offer Status Section -->
								<div class="mt-4 rounded-lg bg-gray-50 p-3">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span class="text-sm text-gray-600">요청 사항</span>
										</div>
										<span class="text-base font-medium text-gray-900">{trip.offerCount || 0}건</span
										>
									</div>
									<p class="mt-2 text-sm text-gray-500">남은 기간 7일</p>
								</div>

								<!-- Action Button -->
								<div
									onclick={(e) => e.stopPropagation()}
									class="mt-4 w-full rounded-lg border border-gray-300 bg-white py-2.5 text-center text-sm font-medium text-gray-700"
								>
									{#if trip.offerCount === 0}
										받은 제안 0건
									{:else}
										받은 제안 {trip.offerCount}건
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

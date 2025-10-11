<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession } from '$lib/authClient';
	import { invalidate } from '$app/navigation';
	import { formatDate, formatDateRange, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';
	import { onMount, onDestroy } from 'svelte';
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
			goto('/');
		}
	});

	// Use $state for trips to enable reactive updates
	let trips = $state(data.trips || []);
	let serverError = $derived(data.error);
	let loading = $derived(data.trips === undefined && !data.error);

	// Loading state for detail navigation
	let navigatingTripId = $state<string | null>(null);

	// Refresh state
	let refreshing = $state(false);

	// Polling state
	let pollingInterval: number | null = null;
	let isPolling = $state(false);
	let lastUpdated = $state(new Date().toISOString());
	let updatedTripIds = $state<Set<string>>(new Set());
	let pollingErrorCount = $state(0);
	const MAX_ERROR_COUNT = 3;
	const POLLING_INTERVAL = 5000; // 5 seconds
	const MAX_POLLING_DURATION = 30 * 60 * 1000; // 30 minutes
	let pollingStartTime: number | null = null;

	// Fetch trips from API
	async function fetchTrips() {
		try {
			const response = await fetch('/api/trips');
			if (!response.ok) {
				throw new Error('Failed to fetch trips');
			}

			const newTrips = await response.json();

			// Check for updated trips (compare offer counts)
			const currentTripsMap = new Map(trips.map((t) => [t.id, t]));
			const updatedIds = new Set<string>();

			for (const newTrip of newTrips) {
				const currentTrip = currentTripsMap.get(newTrip.id);
				if (currentTrip && currentTrip.offerCount !== newTrip.offerCount) {
					updatedIds.add(newTrip.id);
				}
			}

			// Update trip IDs that have changes
			if (updatedIds.size > 0) {
				updatedTripIds = updatedIds;
				// Clear highlights after 5 seconds
				setTimeout(() => {
					updatedTripIds = new Set();
				}, 5000);
			}

			// Update trips
			trips = newTrips;
			lastUpdated = new Date().toISOString();
			pollingErrorCount = 0; // Reset error count on success
		} catch (error) {
			console.error('Error fetching trips:', error);
			pollingErrorCount++;

			// Stop polling after too many errors
			if (pollingErrorCount >= MAX_ERROR_COUNT) {
				stopPolling();
				console.log('Polling stopped due to repeated errors');
			}
		}
	}

	// Start polling
	function startPolling() {
		if (pollingInterval) return; // Already polling

		isPolling = true;
		pollingStartTime = Date.now();

		// Initial fetch
		fetchTrips();

		// Set up interval
		pollingInterval = setInterval(() => {
			// Check if we've been polling too long
			if (pollingStartTime && Date.now() - pollingStartTime > MAX_POLLING_DURATION) {
				stopPolling();
				console.log('Polling stopped due to timeout');
				return;
			}

			// Check if tab is visible (browser only)
			if (typeof document !== 'undefined' && document.hidden) {
				return; // Skip fetch if tab is not visible
			}

			fetchTrips();
		}, POLLING_INTERVAL);
	}

	// Stop polling
	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval);
			pollingInterval = null;
		}
		isPolling = false;
		pollingStartTime = null;
	}

	// Handle visibility change
	function handleVisibilityChange() {
		if (typeof document !== 'undefined') {
			if (document.hidden) {
				// Tab is hidden, pause polling
				console.log('Tab hidden, pausing polling');
			} else {
				// Tab is visible, resume polling if we were polling
				if (isPolling) {
					console.log('Tab visible, resuming polling');
					fetchTrips(); // Immediate fetch when tab becomes visible
				}
			}
		}
	}

	// Lifecycle hooks
	onMount(() => {
		// Start polling for active trips
		const hasActiveTrips = trips.some(
			(t) => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'draft'
		);

		if (hasActiveTrips) {
			startPolling();
		}

		// Listen for visibility changes (browser only)
		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', handleVisibilityChange);
		}
	});

	onDestroy(() => {
		stopPolling();
		if (typeof document !== 'undefined') {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		}
	});

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

	function calculateRemainingDays(startDate: string | Date) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tripStartDate = new Date(startDate);
		tripStartDate.setHours(0, 0, 0, 0);

		const diffTime = tripStartDate.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays < 0) {
			return '여행 시작됨';
		} else if (diffDays === 0) {
			return '오늘 출발';
		} else if (diffDays === 1) {
			return '내일 출발';
		} else {
			return `남은 기간 ${diffDays}일`;
		}
	}

	function goToCreateTrip() {
		goto('/my-trips/create');
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
				<div class="flex items-center gap-3">
					<span class="text-sm text-gray-900">
						전체 <span class="text-sm font-bold text-blue-600">{trips.length}</span>
					</span>
					{#if isPolling}
						<div class="flex items-center gap-1.5">
							<div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
							<span class="text-xs text-gray-500">실시간 업데이트 중</span>
						</div>
					{/if}
				</div>
				<button class="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
					<span>최신순</span>
					<div class="h-4 w-4 flex-shrink-0">
						<svg class="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 px-4 py-6 pb-32">
			{#if loading && !refreshing}
				<!-- Skeleton Loading -->
				<div class="space-y-4">
					{#each [1, 2, 3] as _}
						<div class="w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
							<!-- Status Badge Skeleton -->
							<div class="px-4 pt-4">
								<div class="h-6 w-16 animate-pulse rounded-md bg-gray-200"></div>
							</div>

							<!-- Trip Info Skeleton -->
							<div class="px-4 pb-4">
								<div class="mt-3 h-7 w-3/4 animate-pulse rounded bg-gray-200"></div>

								<!-- Date Skeleton -->
								<div class="mt-2 flex items-center gap-2">
									<div class="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
									<div class="h-4 w-40 animate-pulse rounded bg-gray-200"></div>
								</div>

								<!-- Participants Skeleton -->
								<div class="mt-1 flex items-center gap-2">
									<div class="h-4 w-4 animate-pulse rounded bg-gray-200"></div>
									<div class="h-4 w-32 animate-pulse rounded bg-gray-200"></div>
								</div>

								<!-- Price Skeleton -->
								<div class="mt-3 h-4 w-24 animate-pulse rounded bg-gray-200"></div>

								<!-- Offer Status Skeleton -->
								<div class="mt-4 rounded-lg bg-gray-50 p-3">
									<div class="flex items-center justify-between">
										<div class="h-4 w-16 animate-pulse rounded bg-gray-200"></div>
										<div class="h-5 w-12 animate-pulse rounded bg-gray-200"></div>
									</div>
									<div class="mt-2 h-4 w-20 animate-pulse rounded bg-gray-200"></div>
								</div>

								<!-- Action Button Skeleton -->
								<div class="mt-4 h-10 w-full animate-pulse rounded-lg bg-gray-200"></div>
							</div>
						</div>
					{/each}
				</div>
			{:else if refreshing}
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
							class="relative w-full cursor-pointer overflow-hidden rounded-xl border bg-white text-left transition-shadow hover:shadow-md {updatedTripIds.has(
								trip.id
							)
								? 'animate-pulse border-blue-400 ring-2 ring-blue-100'
								: 'border-gray-100'}"
						>
							<!-- New offer indicator -->
							{#if updatedTripIds.has(trip.id)}
								<div class="absolute top-2 right-2 flex h-3 w-3">
									<span
										class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"
									></span>
									<span class="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
								</div>
							{/if}

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
									{trip.destination?.city || '목적지'}, {trip.country?.name || ''}
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
											? `₩${(trip.minBudget * 10000).toLocaleString()} - ₩${((trip.maxBudget || trip.minBudget) * 10000).toLocaleString()}`
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
								<div
									class="mt-4 rounded-lg p-3 {updatedTripIds.has(trip.id)
										? 'bg-blue-50'
										: 'bg-gray-50'}"
								>
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span
												class="text-sm {updatedTripIds.has(trip.id)
													? 'font-medium text-blue-700'
													: 'text-gray-600'}"
											>
												{updatedTripIds.has(trip.id) ? '새로운 제안!' : '요청 사항'}
											</span>
										</div>
										<span
											class="text-base font-medium {updatedTripIds.has(trip.id)
												? 'text-blue-700'
												: 'text-gray-900'}">{trip.offerCount || 0}건</span
										>
									</div>
									<p class="mt-2 text-sm text-gray-500">{calculateRemainingDays(trip.startDate)}</p>
								</div>

								<!-- Action Button -->
								<div
									onclick={() => goToTripDetails(trip.id)}
									role="button"
									tabindex="0"
									onkeypress={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											goToTripDetails(trip.id);
										}
									}}
									class="mt-4 w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

<style>
	/* Ensure SVGs are properly constrained */
	:global(svg) {
		max-width: 100%;
		max-height: 100%;
	}

	/* Safe area padding for bottom button */
	.pb-safe {
		padding-bottom: env(safe-area-inset-bottom);
	}
</style>

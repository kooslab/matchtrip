<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession } from '$lib/authClient';
	import { invalidate } from '$app/navigation';

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

	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		const year = dateObj.getFullYear();
		const month = String(dateObj.getMonth() + 1).padStart(2, '0');
		const day = String(dateObj.getDate()).padStart(2, '0');
		return `${year}.${month}.${day}`;
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
			draft: 'bg-gray-100 text-gray-800',
			submitted: 'bg-blue-100 text-blue-800',
			accepted: 'bg-green-100 text-green-800',
			completed: 'bg-purple-100 text-purple-800',
			cancelled: 'bg-red-100 text-red-800'
		};
		return colorMap[status] || 'bg-gray-100 text-gray-800';
	}

	function goToCreateTrip() {
		goto('/create-trip');
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
					<h1 class="text-xl font-bold text-gray-900">나의 여행</h1>
					<button
						onclick={refreshTrips}
						disabled={refreshing}
						class="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
						title="새로고침">
						{#if refreshing}
							<div
								class="h-4 w-4 animate-spin rounded-full border border-gray-400 border-t-transparent">
							</div>
						{:else}
							🔄
						{/if}
					</button>
				</div>
				<button
					class="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
					onclick={goToCreateTrip}>
					새 여행 만들기
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 px-4 py-6">
			{#if refreshing}
				<div class="flex items-center justify-center py-12">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent">
					</div>
					<span class="ml-2 text-gray-600">여행 목록을 불러오는 중...</span>
				</div>
			{:else if serverError}
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="text-red-800">{serverError}</p>
					<button
						class="mt-2 text-sm text-red-600 underline hover:text-red-800"
						onclick={refreshTrips}>
						다시 시도
					</button>
				</div>
			{:else if trips.length === 0}
				<div class="flex flex-col items-center justify-center py-12">
					<div class="mb-4 text-6xl">✈️</div>
					<h2 class="mb-2 text-lg font-medium text-gray-900">아직 여행이 없습니다</h2>
					<p class="mb-6 text-gray-600">첫 번째 여행을 만들어보세요!</p>
					<button
						class="rounded-lg bg-pink-500 px-6 py-3 text-base font-medium text-white hover:bg-pink-600"
						onclick={goToCreateTrip}>
						여행 만들기
					</button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each trips as trip}
						<div 
							class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
							onclick={() => goToTripDetails(trip.id)}
							role="button"
							tabindex="0"
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									goToTripDetails(trip.id);
								}
							}}>
							<div class="flex items-start justify-between">
								<div class="flex-1 pointer-events-none">
									<div class="mb-2 flex items-center gap-2">
										<h3 class="text-lg font-medium text-gray-900">
											{trip.destination?.city || '알 수 없는 목적지'}
										</h3>
										<span
											class="rounded-full px-2 py-1 text-xs font-medium {getStatusColor(
												trip.status
											)}">
											{getStatusText(trip.status)}
										</span>
									</div>

									<div class="space-y-1 text-sm text-gray-600">
										<p>📅 {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}</p>
										<p>
											👥 성인 {trip.adultsCount}명{trip.childrenCount > 0
												? `, 유아 ${trip.childrenCount}명`
												: ''}
										</p>
										{#if trip.travelMethod}
											<p>🚶 {trip.travelMethod}</p>
										{/if}
										{#if trip.customRequest}
											<p class="mt-2 text-gray-700">💬 {trip.customRequest}</p>
										{/if}
									</div>
								</div>

								<div class="ml-4 flex flex-col gap-2">
									<button
										onclick={(e) => {
											e.stopPropagation();
											goToTripDetails(trip.id);
										}}
										disabled={navigatingTripId === trip.id}
										class="flex items-center justify-center gap-1 rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50">
										{#if navigatingTripId === trip.id}
											<div
												class="h-3 w-3 animate-spin rounded-full border border-gray-500 border-t-transparent">
											</div>
											<span>로딩중...</span>
										{:else}
											상세보기
										{/if}
									</button>
									{#if trip.status === 'draft'}
										<button
											onclick={(e) => e.stopPropagation()}
											class="rounded bg-pink-100 px-3 py-1 text-sm text-pink-700 hover:bg-pink-200">
											수정하기
										</button>
									{/if}
									{#if trip.offerCount > 0}
										<span class="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700">
											{trip.offerCount}건 제안
										</span>
									{/if}
								</div>
							</div>

							<div class="mt-3 text-xs text-gray-500 pointer-events-none">
								생성일: {formatDate(trip.createdAt)}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

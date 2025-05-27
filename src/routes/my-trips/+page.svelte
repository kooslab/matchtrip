<script lang="ts">
	import { goto } from '$app/navigation';
	import { useSession } from '$lib/authClient';
	import { onMount } from 'svelte';

	// Authentication check
	const session = useSession();

	// Check if user is authenticated, redirect to signin if not
	$effect(() => {
		if (!$session.isPending && !$session.data) {
			goto('/signin');
		}
	});

	// Trips state
	let trips: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	// Fetch user's trips
	async function fetchTrips() {
		if (!$session.data) return;

		try {
			loading = true;
			console.log('Fetching trips...');
			const response = await fetch('/api/trips', {
				credentials: 'include'
			});
			console.log('Response status:', response.status);

			if (!response.ok) {
				console.error('Response not ok:', response.status, response.statusText);
				error = `서버 오류: ${response.status} ${response.statusText}`;
				return;
			}

			const responseText = await response.text();
			console.log('Raw response:', responseText);

			let data;
			try {
				data = JSON.parse(responseText);
				console.log('Parsed response data:', data);
			} catch (parseError) {
				console.error('JSON parse error:', parseError);
				console.error('Response was:', responseText.substring(0, 500));
				error = '서버에서 잘못된 응답을 받았습니다.';
				return;
			}

			if (data.success) {
				trips = data.trips || [];
			} else {
				error = data.error || '여행 목록을 불러오는데 실패했습니다.';
			}
		} catch (err) {
			console.error('Error fetching trips:', err);
			error = `서버 오류가 발생했습니다: ${err instanceof Error ? err.message : String(err)}`;
		} finally {
			loading = false;
		}
	}

	// Fetch trips when component mounts and user is authenticated
	$effect(() => {
		if ($session.data && !$session.isPending) {
			fetchTrips();
		}
	});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
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
				<h1 class="text-xl font-bold text-gray-900">나의 여행</h1>
				<button
					class="rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600"
					onclick={goToCreateTrip}>
					새 여행 만들기
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 px-4 py-6">
			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent">
					</div>
					<span class="ml-2 text-gray-600">여행 목록을 불러오는 중...</span>
				</div>
			{:else if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-4">
					<p class="text-red-800">{error}</p>
					<button
						class="mt-2 text-sm text-red-600 underline hover:text-red-800"
						onclick={fetchTrips}>
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
						<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
							<div class="flex items-start justify-between">
								<div class="flex-1">
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
										onclick={() => goto(`/my-trips/details?tripId=${trip.id}`)}
										class="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
										상세보기
									</button>
									{#if trip.status === 'draft'}
										<button
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

							<div class="mt-3 text-xs text-gray-500">
								생성일: {formatDate(trip.createdAt)}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

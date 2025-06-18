<script lang="ts">
	import { goto } from '$app/navigation';
	import { MessageSquare } from 'lucide-svelte';
	import { formatDate, formatDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';
	
	let { data } = $props();

	let offers = $derived(data.offers);
	let totalOffers = $derived(data.totalOffers);

	function formatOfferDate(date: Date | string) {
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

	function getStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'accepted':
				return 'bg-green-100 text-green-800';
			case 'rejected':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'pending':
				return '검토중';
			case 'accepted':
				return '수락됨';
			case 'rejected':
				return '거절됨';
			default:
				return status;
		}
	}

	async function startConversation(offerId: string) {
		try {
			const response = await fetch('/api/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ offerId })
			});

			if (response.ok) {
				const data = await response.json();
				goto(`/conversations/${data.conversation.id}`);
			} else {
				console.error('Failed to create conversation');
			}
		} catch (error) {
			console.error('Error creating conversation:', error);
		}
	}
</script>

<svelte:head>
	<title>나의 제안 - MatchTrip</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 text-3xl font-bold text-gray-900">나의 제안</h1>
		<p class="mb-6 text-gray-600">내가 제안한 여행들을 상태별로 확인하세요</p>

		<!-- Statistics Cards -->
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			<!-- Total Offers -->
			<div class="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
				<div class="text-2xl font-bold text-gray-900">{totalOffers}</div>
				<div class="text-sm text-gray-500">총 제안</div>
			</div>

			<!-- Pending Offers -->
			<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center shadow-sm">
				<div class="text-2xl font-bold text-yellow-800">{offers.pending.length}</div>
				<div class="text-sm text-yellow-600">검토중</div>
			</div>

			<!-- Accepted Offers -->
			<div class="rounded-lg border border-green-200 bg-green-50 p-4 text-center shadow-sm">
				<div class="text-2xl font-bold text-green-800">{offers.accepted.length}</div>
				<div class="text-sm text-green-600">수락됨</div>
			</div>

			<!-- Rejected Offers -->
			<div class="rounded-lg border border-red-200 bg-red-50 p-4 text-center shadow-sm">
				<div class="text-2xl font-bold text-red-800">{offers.rejected.length}</div>
				<div class="text-sm text-red-600">거절됨</div>
			</div>
		</div>
	</div>

	{#if totalOffers === 0}
		<div class="py-12 text-center">
			<div class="mx-auto mb-4 h-24 w-24 text-gray-400">
				<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">아직 제안한 여행이 없습니다</h3>
			<p class="mb-4 text-gray-500">여행찾기에서 새로운 여행에 제안해보세요!</p>
			<button
				onclick={() => goto('/trips')}
				class="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
				여행찾기
			</button>
		</div>
	{:else}
		<!-- Pending Offers -->
		{#if offers.pending.length > 0}
			<div class="mb-8">
				<h2 class="mb-4 flex items-center text-xl font-semibold text-gray-900">
					<span class="mr-2 h-3 w-3 rounded-full bg-yellow-400"></span>
					검토중인 제안 ({offers.pending.length}개)
				</h2>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each offers.pending as offer}
						<div
							class="overflow-hidden rounded-lg border border-yellow-200 bg-white shadow-md transition-shadow hover:shadow-lg">
							<div class="p-6">
								<div class="mb-4 flex items-start justify-between">
									<div>
										<h3 class="mb-1 text-lg font-semibold text-gray-900">
											{offer.destination.city}, {offer.destination.country}
										</h3>
										<p class="text-sm text-gray-500">
											{offer.traveler.name}님의 여행
										</p>
									</div>
									<span
										class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
											offer.status
										)}">
										{getStatusText(offer.status)}
									</span>
								</div>

								<div class="mb-4 space-y-1">
									<p class="text-sm text-gray-600">
										📅 {formatDateRange(offer.trip.startDate, offer.trip.endDate, { locale: $userLocale, timezone: $userTimezone, format: 'long' })}
									</p>
									<p class="text-sm text-gray-600">
										👥 성인 {offer.trip.adultsCount}명
										{#if offer.trip.childrenCount > 0}
											, 아동 {offer.trip.childrenCount}명
										{/if}
									</p>
									<p class="text-sm text-gray-600">
										🚶 {formatTravelMethod(offer.trip.travelMethod)}
									</p>
								</div>

								<div class="mb-4 rounded-md bg-yellow-50 p-3">
									<p class="text-sm font-medium text-yellow-800">내 제안 금액</p>
									<p class="text-lg font-bold text-yellow-900">
										{offer.price.toLocaleString('ko-KR')}원
									</p>
								</div>

								{#if offer.trip.customRequest}
									<div class="mb-4">
										<h4 class="mb-1 text-sm font-medium text-gray-900">특별 요청사항</h4>
										<p class="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
											{offer.trip.customRequest}
										</p>
									</div>
								{/if}

								<div class="border-t border-gray-100 pt-4">
									<div class="flex items-center justify-between">
										<span class="text-xs text-gray-500">
											{formatOfferDate(offer.createdAt)} 제안
										</span>
										<div class="flex gap-2">
											<button
												onclick={() => startConversation(offer.id)}
												class="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
												<MessageSquare class="h-3 w-3" />
												대화하기
											</button>
											<button
												onclick={() => goto(`/my-offers/${offer.id}`)}
												class="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
												상세보기
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Accepted Offers -->
		{#if offers.accepted.length > 0}
			<div class="mb-8">
				<h2 class="mb-4 flex items-center text-xl font-semibold text-gray-900">
					<span class="mr-2 h-3 w-3 rounded-full bg-green-400"></span>
					수락된 제안 ({offers.accepted.length}개)
				</h2>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each offers.accepted as offer}
						<div
							class="overflow-hidden rounded-lg border border-green-200 bg-white shadow-md transition-shadow hover:shadow-lg">
							<div class="p-6">
								<div class="mb-4 flex items-start justify-between">
									<div>
										<h3 class="mb-1 text-lg font-semibold text-gray-900">
											{offer.destination.city}, {offer.destination.country}
										</h3>
										<p class="text-sm text-gray-500">
											{offer.traveler.name}님의 여행
										</p>
									</div>
									<span
										class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
											offer.status
										)}">
										{getStatusText(offer.status)}
									</span>
								</div>

								<div class="mb-4 space-y-1">
									<p class="text-sm text-gray-600">
										📅 {formatDateRange(offer.trip.startDate, offer.trip.endDate, { locale: $userLocale, timezone: $userTimezone, format: 'long' })}
									</p>
									<p class="text-sm text-gray-600">
										👥 성인 {offer.trip.adultsCount}명
										{#if offer.trip.childrenCount > 0}
											, 아동 {offer.trip.childrenCount}명
										{/if}
									</p>
									<p class="text-sm text-gray-600">
										🚶 {formatTravelMethod(offer.trip.travelMethod)}
									</p>
								</div>

								<div class="mb-4 rounded-md bg-green-50 p-3">
									<p class="text-sm font-medium text-green-800">확정 금액</p>
									<p class="text-lg font-bold text-green-900">
										{offer.price.toLocaleString('ko-KR')}원
									</p>
								</div>

								{#if offer.trip.customRequest}
									<div class="mb-4">
										<h4 class="mb-1 text-sm font-medium text-gray-900">특별 요청사항</h4>
										<p class="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
											{offer.trip.customRequest}
										</p>
									</div>
								{/if}

								<div class="border-t border-gray-100 pt-4">
									<div class="flex items-center justify-between">
										<span class="text-xs text-gray-500">
											{formatOfferDate(offer.createdAt)} 제안
										</span>
										<div class="flex gap-2">
											<button
												onclick={() => startConversation(offer.id)}
												class="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
												<MessageSquare class="h-3 w-3" />
												대화하기
											</button>
											<button
												onclick={() => goto(`/my-offers/${offer.id}`)}
												class="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
												상세보기
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Rejected Offers -->
		{#if offers.rejected.length > 0}
			<div class="mb-8">
				<h2 class="mb-4 flex items-center text-xl font-semibold text-gray-900">
					<span class="mr-2 h-3 w-3 rounded-full bg-red-400"></span>
					거절된 제안 ({offers.rejected.length}개)
				</h2>
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each offers.rejected as offer}
						<div
							class="overflow-hidden rounded-lg border border-red-200 bg-white shadow-md transition-shadow hover:shadow-lg">
							<div class="p-6">
								<div class="mb-4 flex items-start justify-between">
									<div>
										<h3 class="mb-1 text-lg font-semibold text-gray-900">
											{offer.destination.city}, {offer.destination.country}
										</h3>
										<p class="text-sm text-gray-500">
											{offer.traveler.name}님의 여행
										</p>
									</div>
									<span
										class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusColor(
											offer.status
										)}">
										{getStatusText(offer.status)}
									</span>
								</div>

								<div class="mb-4 space-y-1">
									<p class="text-sm text-gray-600">
										📅 {formatDateRange(offer.trip.startDate, offer.trip.endDate, { locale: $userLocale, timezone: $userTimezone, format: 'long' })}
									</p>
									<p class="text-sm text-gray-600">
										👥 성인 {offer.trip.adultsCount}명
										{#if offer.trip.childrenCount > 0}
											, 아동 {offer.trip.childrenCount}명
										{/if}
									</p>
									<p class="text-sm text-gray-600">
										🚶 {formatTravelMethod(offer.trip.travelMethod)}
									</p>
								</div>

								<div class="mb-4 rounded-md bg-red-50 p-3">
									<p class="text-sm font-medium text-red-800">제안했던 금액</p>
									<p class="text-lg font-bold text-red-900">
										{offer.price.toLocaleString('ko-KR')}원
									</p>
								</div>

								{#if offer.trip.customRequest}
									<div class="mb-4">
										<h4 class="mb-1 text-sm font-medium text-gray-900">특별 요청사항</h4>
										<p class="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
											{offer.trip.customRequest}
										</p>
									</div>
								{/if}

								<div class="border-t border-gray-100 pt-4">
									<div class="flex items-center justify-between">
										<span class="text-xs text-gray-500">
											{formatOfferDate(offer.createdAt)} 제안
										</span>
										<div class="flex gap-2">
											<button
												onclick={() => startConversation(offer.id)}
												class="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
												<MessageSquare class="h-3 w-3" />
												대화하기
											</button>
											<button
												onclick={() => goto(`/my-offers/${offer.id}`)}
												class="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200">
												상세보기
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

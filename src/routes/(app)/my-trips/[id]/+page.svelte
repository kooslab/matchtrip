<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PaymentModal from '$lib/components/PaymentModal.svelte';
	import { MessageSquare, Star, ArrowLeft, ChevronDown } from 'lucide-svelte';
	import { formatKoreanDate, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import pdfIconUrl from '$lib/icons/icon-document-mono.svg';
	import downloadIconUrl from '$lib/icons/icon-download-mono.svg';

	let { data } = $props();
	let trip = $derived(data.trip);
	let offers = $derived(data.offers);
	let acceptedOffer = $derived(offers.find((o) => o.status === 'accepted'));

	// State for offer actions
	let processingOfferId = $state<string | null>(null);
	let showPaymentModal = $state(false);
	let selectedOffer = $state<any>(null);

	// Tab state
	let activeTab = $state<'info' | 'offers'>('info');

	// Expandable sections
	let expandedSections = $state({
		request: true,
		files: true
	});

	// Calculate nights and days
	function calculateNightsAndDays(startDate: Date | string, endDate: Date | string) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const days = nights + 1;
		return `${nights}박 ${days}일`;
	}

	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
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

	function getOfferStatusText(status: string) {
		const statusMap: Record<string, string> = {
			pending: '검토 중',
			accepted: '수락됨',
			rejected: '거절됨',
			withdrawn: '철회됨'
		};
		return statusMap[status] || status;
	}

	function getOfferStatusColor(status: string) {
		const colorMap: Record<string, string> = {
			pending: 'bg-yellow-100 text-yellow-800',
			accepted: 'bg-green-100 text-green-800',
			rejected: 'bg-red-100 text-red-800',
			withdrawn: 'bg-gray-100 text-gray-800'
		};
		return colorMap[status] || 'bg-gray-100 text-gray-800';
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

	async function handleOfferAction(offerId: string, action: 'accept' | 'reject') {
		if (processingOfferId) return;

		// If accepting, show payment modal
		if (action === 'accept') {
			const offer = offers.find((o) => o.id === offerId);
			if (offer) {
				selectedOffer = offer;
				showPaymentModal = true;
			}
			return;
		}

		// For reject action, proceed with API call
		try {
			processingOfferId = offerId;
			const response = await fetch('/api/offers/action', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					offerId,
					action
				})
			});

			const result = await response.json();

			if (result.success) {
				// Refresh the page to show updated data
				window.location.reload();
			} else {
				alert(result.error || '처리 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Error processing offer:', error);
			alert('서버 오류가 발생했습니다.');
		} finally {
			processingOfferId = null;
		}
	}
</script>

<svelte:head>
	<title>{trip.destination?.city || '여행'} - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="flex h-14 items-center justify-between px-4">
			<div class="flex items-center">
				<button onclick={() => goto('/my-trips')} class="mr-4">
					<img src={arrowLeftUrl} alt="Back" class="h-6 w-6" />
				</button>
				<h1 class="text-lg font-semibold text-gray-900">
					{trip.destination?.city || '목적지'}, {trip.destination?.country || ''}
				</h1>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-500">받은 제안</span>
				<span class="rounded-full bg-gray-100 px-2 py-0.5 text-sm font-medium"
					>{offers.length || 0}</span
				>
			</div>
		</div>

		<!-- Tabs -->
		<div class="flex border-b border-gray-200">
			<button
				class="flex-1 py-3 text-sm font-medium {activeTab === 'info'
					? 'border-b-2 border-gray-900 text-gray-900'
					: 'text-gray-500'}"
				onclick={() => (activeTab = 'info')}
			>
				여행 정보
			</button>
			<button
				class="flex-1 py-3 text-sm font-medium {activeTab === 'offers'
					? 'border-b-2 border-gray-900 text-gray-900'
					: 'text-gray-500'}"
				onclick={() => (activeTab = 'offers')}
			>
				받은 제안 ({offers.length})
			</button>
		</div>
	</header>

	<!-- Content -->
	<div class="pb-32">
		{#if activeTab === 'info'}
			<!-- Trip Info Tab -->
			<div class="space-y-4 px-4 py-4">
				<!-- Budget Section -->
				<div class="rounded-lg bg-white shadow-sm">
					<div class="border-b border-gray-100 p-4">
						<h3 class="mb-4 text-base font-semibold text-gray-900">여행 정보</h3>
						<div class="flex items-center justify-between">
							<div>
								<p class="text-2xl font-bold text-gray-900">
									{trip.minBudget || '200'} ~{trip.maxBudget || '500'} 만원
								</p>
								<p class="mt-1 text-sm text-gray-500">예산 범위</p>
							</div>
						</div>
					</div>

					<div class="space-y-3 px-4 py-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">현재 상태</span>
							<span
								class="inline-flex items-center rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white"
							>
								{getStatusText(trip.status)}
							</span>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">여행 일정</span>
							<div class="text-right">
								<span class="text-sm font-medium text-blue-600"
									>{formatKoreanDateRange(trip.startDate, trip.endDate)}</span
								>
								<span class="ml-2 text-sm text-gray-600"
									>{calculateNightsAndDays(trip.startDate, trip.endDate)}</span
								>
							</div>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">인원</span>
							<span class="text-sm text-gray-900">
								성인 {trip.adultsCount}명{trip.childrenCount > 0
									? `, 아동 ${trip.childrenCount}명`
									: ''}
							</span>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">선호 스타일</span>
							<span class="text-sm text-gray-900">
								{trip.travelMethod ? formatTravelMethod(trip.travelMethod) : '모험적인 여행'}
							</span>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">관심 활동</span>
							<span class="text-sm text-gray-900">자연 / 아웃도어</span>
						</div>
					</div>
				</div>

				<!-- Custom Request Section -->
				{#if trip.customRequest}
					<div class="rounded-lg bg-white">
						<button
							class="flex w-full items-center justify-between p-4"
							onclick={() => (expandedSections.request = !expandedSections.request)}
						>
							<h2 class="text-base font-semibold text-gray-900">요청 사항</h2>
							<ChevronDown
								class="h-5 w-5 text-gray-400 transition-transform {expandedSections.request
									? 'rotate-180'
									: ''}"
							/>
						</button>
						{#if expandedSections.request}
							<div class="px-4 pb-4">
								<p class="text-sm text-gray-600">{trip.customRequest}</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Attached Files Section -->
				<div class="rounded-lg bg-white">
					<button
						class="flex w-full items-center justify-between p-4"
						onclick={() => (expandedSections.files = !expandedSections.files)}
					>
						<h2 class="text-base font-semibold text-gray-900">첨부 파일</h2>
						<ChevronDown
							class="h-5 w-5 text-gray-400 transition-transform {expandedSections.files
								? 'rotate-180'
								: ''}"
						/>
					</button>
					{#if expandedSections.files}
						<div class="px-4 pb-4">
							<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3">
								<div class="flex items-center gap-3">
									<img src={pdfIconUrl} alt="PDF" class="h-8 w-8" />
									<div>
										<p class="text-sm font-medium text-gray-900">여행계획표.pdf</p>
										<p class="text-xs text-gray-500">2MB</p>
									</div>
								</div>
								<button class="rounded-lg p-2 transition-colors hover:bg-gray-200">
									<img src={downloadIconUrl} alt="Download" class="h-5 w-5" />
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Bottom Button - Only show when no offers -->
			{#if offers.length === 0}
				<div class="fixed right-0 bottom-14 left-0 border-t border-gray-200 bg-white p-4">
					<button
						onclick={() => goto(`/my-trips/${trip.id}/edit`)}
						class="w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600"
					>
						계획 변경하기
					</button>
				</div>
			{/if}
		{:else}
			<!-- Offers Tab -->
			<div class="px-4 py-4">
				{#if offers.length === 0}
					<div class="py-16 text-center">
						<div class="mb-4 text-6xl">📝</div>
						<h3 class="mb-2 text-lg font-medium text-gray-900">아직 제안이 없습니다</h3>
						<p class="text-gray-600">가이드들의 제안을 기다려보세요!</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each offers as offer}
							<div class="rounded-lg border border-gray-200 bg-white p-4">
								<div class="mb-3 flex items-start justify-between">
									<div>
										<h3 class="font-medium text-gray-900">
											{offer.guide?.name || '알 수 없는 가이드'} 가이드
										</h3>
										<p class="text-sm text-gray-600">{offer.guide?.email || ''}</p>
									</div>
									<div class="text-right">
										<span
											class="inline-block rounded-md px-2 py-1 text-xs font-medium {getOfferStatusColor(
												offer.status
											)}"
										>
											{getOfferStatusText(offer.status)}
										</span>
										<p class="mt-1 text-lg font-semibold text-gray-900">
											{offer.price.toLocaleString()}원
										</p>
									</div>
								</div>

								{#if offer.itinerary}
									<div class="mb-3">
										<h4 class="mb-2 text-sm font-medium text-gray-900">여행 일정</h4>
										<div class="rounded bg-gray-50 p-3 text-sm text-gray-700">
											{@html offer.itinerary}
										</div>
									</div>
								{/if}

								<div class="mt-4 flex gap-2">
									<button
										onclick={() => goto(`/guide/${offer.guideId}`)}
										class="flex-1 rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
									>
										가이드 프로필
									</button>
									<button
										onclick={() => startConversation(offer.id)}
										class="flex-1 rounded bg-blue-100 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
									>
										대화하기
									</button>
									{#if offer.status === 'pending'}
										<button
											onclick={() => handleOfferAction(offer.id, 'accept')}
											disabled={processingOfferId === offer.id}
											class="flex-1 rounded bg-green-100 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
										>
											{processingOfferId === offer.id ? '처리 중...' : '수락'}
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Payment Modal -->
{#if selectedOffer}
	<PaymentModal
		bind:isOpen={showPaymentModal}
		onClose={() => {
			showPaymentModal = false;
			selectedOffer = null;
		}}
		offer={selectedOffer}
		{trip}
	/>
{/if}

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PaymentModal from '$lib/components/PaymentModal.svelte';
	import { MessageSquare, Star } from 'lucide-svelte';

	let { data } = $props();
	let trip = $derived(data.trip);
	let offers = $derived(data.offers);
	let acceptedOffer = $derived(offers.find(o => o.status === 'accepted'));

	// State for offer actions
	let processingOfferId = $state<string | null>(null);
	let showPaymentModal = $state(false);
	let selectedOffer = $state<any>(null);

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
	<title>여행 상세보기 - MatchTrip</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<button
			class="mb-4 text-sm text-gray-600 hover:text-gray-800"
			onclick={() => goto('/my-trips')}>
			← 나의 여행으로 돌아가기
		</button>
		<h1 class="text-3xl font-bold text-gray-900">여행 상세보기</h1>
	</div>

	<!-- Trip Details -->
	<div class="mb-8 rounded-lg border border-gray-200 bg-white p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-semibold text-gray-900">
				{trip.destination?.city || '알 수 없는 도시'}, {trip.destination?.country ||
					'알 수 없는 국가'}
			</h2>
			<span class="rounded-full px-3 py-1 text-sm font-medium {getStatusColor(trip.status)}">
				{getStatusText(trip.status)}
			</span>
		</div>

		<div class="space-y-3 text-sm text-gray-600">
			<p>📅 {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}</p>
			<p>
				👥 성인 {trip.adultsCount}명{trip.childrenCount > 0 ? `, 유아 ${trip.childrenCount}명` : ''}
			</p>
			{#if trip.travelMethod}
				<p>🚶 {formatTravelMethod(trip.travelMethod)}</p>
			{/if}
			{#if trip.customRequest}
				<div class="mt-4">
					<h4 class="mb-2 font-medium text-gray-900">특별 요청사항</h4>
					<p class="rounded-md bg-gray-50 p-3 text-gray-600">{trip.customRequest}</p>
				</div>
			{/if}
		</div>

		<div class="mt-4 text-xs text-gray-500">
			생성일: {formatDate(trip.createdAt)}
		</div>
	</div>

	<!-- Offers Section -->
	<div class="rounded-lg border border-gray-200 bg-white p-6">
		<h2 class="mb-6 text-xl font-semibold text-gray-900">
			받은 제안 ({offers.length}건)
		</h2>

		{#if offers.length === 0}
			<div class="py-12 text-center">
				<div class="mb-4 text-6xl">📝</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">아직 제안이 없습니다</h3>
				<p class="text-gray-600">가이드들의 제안을 기다려보세요!</p>
			</div>
		{:else}
			<div class="space-y-6">
				{#each offers as offer}
					<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
						<div class="mb-4 flex items-start justify-between">
							<div>
								<h3 class="font-medium text-gray-900">
									{offer.guide?.name || '알 수 없는 가이드'} 가이드
								</h3>
								<p class="text-sm text-gray-600">{offer.guide?.email || '이메일 없음'}</p>
							</div>
							<div class="text-right">
								<span
									class="inline-block rounded-full px-2 py-1 text-xs font-medium {getOfferStatusColor(
										offer.status
									)}">
									{getOfferStatusText(offer.status)}
								</span>
								<p class="mt-1 text-lg font-semibold text-gray-900">
									{offer.price.toLocaleString()}원
								</p>
								<p class="text-xs text-gray-500">총 금액</p>
							</div>
						</div>

						{#if offer.itinerary}
							<div class="mb-4">
								<h4 class="mb-2 text-sm font-medium text-gray-900">여행 일정</h4>
								<div class="rounded-md bg-white p-3 text-sm text-gray-700">
									{@html offer.itinerary}
								</div>
							</div>
						{/if}

						<div class="flex flex-col items-center justify-start gap-y-2">
							<span class="text-xs text-gray-500">
								제안일: {formatDate(offer.createdAt)}
							</span>

							<div class="flex gap-2">
								<button
									onclick={() => goto(`/guide/${offer.guideId}`)}
									class="flex items-center gap-1 rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200">
									가이드 프로필
								</button>
								<button
									onclick={() => startConversation(offer.id)}
									class="flex items-center gap-1 rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200">
									<MessageSquare class="h-3 w-3" />
									대화하기
								</button>
								{#if offer.status === 'pending'}
									<button
										onclick={() => handleOfferAction(offer.id, 'reject')}
										disabled={processingOfferId === offer.id}
										class="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200 disabled:opacity-50">
										{processingOfferId === offer.id ? '처리 중...' : '거절'}
									</button>
									<button
										onclick={() => handleOfferAction(offer.id, 'accept')}
										disabled={processingOfferId === offer.id}
										class="rounded bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200 disabled:opacity-50">
										{processingOfferId === offer.id ? '처리 중...' : '수락'}
									</button>
								{/if}
								{#if offer.status === 'accepted' && trip.status === 'completed'}
									<button
										onclick={() => goto(`/my-trips/${trip.id}/review`)}
										class="flex items-center gap-1 rounded bg-yellow-100 px-3 py-1 text-sm text-yellow-700 hover:bg-yellow-200">
										<Star class="h-3 w-3" />
										리뷰 작성
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
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
		{trip} />
{/if}

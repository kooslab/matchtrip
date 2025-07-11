<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PaymentModal from '$lib/components/PaymentModal.svelte';
	import OfferSummaryCard from '$lib/components/OfferSummaryCard.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { MessageSquare, Star, ArrowLeft, ChevronDown } from 'lucide-svelte';
	import { formatKoreanDate, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import pdfIconUrl from '$lib/icons/icon-document-mono.svg';
	import downloadIconUrl from '$lib/icons/icon-download-mono.svg';
	import dotsIconUrl from '$lib/icons/icon-dots-four-horizontal-mono.svg';

	interface TripData {
		id: string;
		userId: string;
		adultsCount: number;
		childrenCount: number | null;
		startDate: string;
		endDate: string;
		travelMethod: string | null;
		customRequest: string | null;
		status: string;
		createdAt: string;
		budgetMin: number | null;
		budgetMax: number | null;
		travelStyle: string | null;
		activities: string[] | null;
		destination: {
			id: string;
			city: string;
			country: string;
		} | null;
	}

	let { data } = $props();
	let trip = $derived(data.trip as TripData);
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

	function formatTravelStyle(style: string | null) {
		if (!style) return '미정';
		
		const styleMap: Record<string, string> = {
			friends: '친구들과 함께 하는 여행',
			parents: '부모님과 함께 하는 여행',
			children: '자녀와 함께 하는 여행',
			business: '직장동료와 함께하는 비즈니스 여행',
			other: '기타여행'
		};
		
		return styleMap[style] || style;
	}

	function formatActivities(activities: string[] | null) {
		if (!activities || activities.length === 0) return '미정';
		
		const activityMap: Record<string, string> = {
			'city-tour': '시내투어',
			'suburb-tour': '근교투어',
			'snap-photo': '스냅사진',
			'vehicle-tour': '차량투어',
			'airport-pickup': '공항픽업',
			'bus-charter': '버스대절',
			'interpretation': '통역 서비스',
			'accommodation': '숙박(민박)',
			'organization-visit': '기관방문',
			'other-tour': '기타투어'
		};
		
		return activities.map(activity => activityMap[activity] || activity).join(' / ');
	}

	function formatBudget(amount: number | null): string {
		if (!amount) return '';
		
		// If 10,000 or more, show in 만원
		if (amount >= 10000) {
			const manWon = amount / 10000;
			// If it's a whole number, show without decimals
			if (manWon % 1 === 0) {
				return `${manWon.toLocaleString()}만원`;
			} else {
				// Show with one decimal place
				return `${manWon.toFixed(1)}만원`;
			}
		} else {
			// Less than 10,000, show in 원 with comma formatting
			return `${amount.toLocaleString()}원`;
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
				goto(`/chat/${data.conversation.id}`);
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
				<BackButton href="/my-trips" class="mr-4" />
				<h1 class="text-lg font-semibold text-gray-900">
					{trip.destination?.city || '목적지'}, {trip.destination?.country || ''}
				</h1>
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
									{#if trip.budgetMin || trip.budgetMax}
										{formatBudget(trip.budgetMin)}{#if trip.budgetMin && trip.budgetMax} ~ {/if}{formatBudget(trip.budgetMax)}
									{:else}
										미정
									{/if}
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
								{formatTravelStyle(trip.travelStyle)}
							</span>
						</div>

						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-600">관심 활동</span>
							<span class="text-sm text-gray-900">{formatActivities(trip.activities)}</span>
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

			<!-- Bottom Button -->
			<div class="fixed right-0 bottom-14 left-0 border-t border-gray-200 bg-white">
				<div class="box-border content-stretch flex flex-row gap-4 items-center justify-start pl-5 pr-4 py-2 relative w-full">
					<button 
						class="opacity-40 overflow-clip relative shrink-0 size-5 -rotate-90"
						onclick={() => {/* Handle dots menu */}}
					>
						<div class="absolute bottom-[13.454%] left-[13.454%] right-[13.454%] top-[13.454%]">
							<img
								alt=""
								class="block max-w-none size-full"
								src={dotsIconUrl}
							/>
						</div>
					</button>
					{#if offers.length === 0}
						<button
							onclick={() => goto(`/my-trips/${trip.id}/edit`)}
							class="basis-0 bg-[#1095f4] grow h-12 min-h-px min-w-px relative rounded-[9px] shrink-0 flex flex-row items-center justify-center"
						>
							<div class="box-border content-stretch flex flex-row gap-2.5 h-12 items-center justify-center px-6 py-3.5 relative w-full">
								<div class="font-semibold leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-center text-nowrap">
									<p class="block leading-[20px] whitespace-pre">계획 변경하기</p>
								</div>
							</div>
						</button>
					{:else if acceptedOffer}
						<button
							onclick={() => startConversation(acceptedOffer.id)}
							class="basis-0 bg-[#1095f4] grow h-12 min-h-px min-w-px relative rounded-[9px] shrink-0 flex flex-row items-center justify-center"
						>
							<div class="box-border content-stretch flex flex-row gap-2.5 h-12 items-center justify-center px-6 py-3.5 relative w-full">
								<MessageSquare class="h-4 w-4 text-white" />
								<div class="font-semibold leading-[0] not-italic relative shrink-0 text-[#ffffff] text-[14px] text-center text-nowrap">
									<p class="block leading-[20px] whitespace-pre">대화하기</p>
								</div>
							</div>
						</button>
					{/if}
				</div>
			</div>
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
						<div class="box-border content-stretch flex flex-col gap-1 items-start justify-start p-0 relative shrink-0 w-full">
							<div class="box-border content-stretch flex flex-row items-center justify-between pb-0 pt-3 px-0 relative shrink-0 w-full">
								<div class="box-border content-stretch flex flex-row gap-2 items-center justify-start p-0 relative shrink-0">
									<div class="box-border content-stretch flex flex-row font-bold gap-1 items-center justify-start leading-[0] not-italic p-0 relative shrink-0 text-[12px] text-left text-nowrap">
										<div class="relative shrink-0 text-[#052236]">
											<p class="block leading-[16px] text-nowrap whitespace-pre">전체</p>
										</div>
										<div class="relative shrink-0 text-[#1095f4]">
											<p class="block leading-[16px] text-nowrap whitespace-pre">{offers.length}</p>
										</div>
									</div>
								</div>
								<div class="box-border content-stretch flex flex-row gap-2 items-center justify-end p-0 relative shrink-0">
									<div class="box-border content-stretch flex flex-row gap-1 items-center justify-end p-0 relative shrink-0">
										<div class="font-medium leading-[0] not-italic relative shrink-0 text-[#052236] text-[12px] text-nowrap text-right">
											<p class="block leading-[18px] whitespace-pre">최신순</p>
										</div>
										<div class="flex h-[0px] items-center justify-center relative shrink-0 w-[0px]">
											<div class="flex-none rotate-[90deg]">
												<ChevronDown class="h-3 w-3" />
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						{#each offers as offer, index}
							<OfferSummaryCard 
								{offer} 
								onclick={() => goto(`/my-trips/${trip.id}/offers/${offer.id}`)}
								showBadge={index === 0}
								badgeText={index === 0 ? '가장 저렴한 가격' : ''}
								badgeColor="#4daeeb"
							/>
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

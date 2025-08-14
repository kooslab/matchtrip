<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import PaymentModal from '$lib/components/PaymentModal.svelte';
	import OfferSummaryCard from '$lib/components/OfferSummaryCard.svelte';
	import OfferDetailModal from '$lib/components/OfferDetailModal.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import { MessageSquare, Star, ArrowLeft, ChevronDown } from 'lucide-svelte';
	import { formatKoreanDate, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import pdfIconUrl from '$lib/icons/icon-document-mono.svg';
	import downloadIconUrl from '$lib/icons/icon-download-mono.svg';
	import dotsIconUrl from '$lib/icons/icon-dots-four-horizontal-mono.svg';
	import chatIconUrl from '$lib/icons/icon-chat-bubble-dots-mono.svg';
	import starIconUrl from '$lib/icons/icon-star-mono.svg';
	import {
		formatTravelStyle,
		formatTravelMethod,
		formatActivities,
		formatTripStatus,
		formatOfferStatus
	} from '$lib/utils/travelFormatters';

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
	console.log('trip', trip);
	let offers = $derived(data.offers);
	console.log('offers', offers);
	let acceptedOffer = $derived(offers.find((o) => o.status === 'accepted'));
	let review = $derived(data.review);

	// Check if trip has ended and review can be written
	let tripHasEnded = $derived(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endDate = new Date(trip.endDate);
		endDate.setHours(0, 0, 0, 0);
		return endDate <= today;
	});

	let canWriteReview = $derived(() => {
		console.log('canWriteReview check:', {
			acceptedOffer: !!acceptedOffer,
			tripHasEnded: tripHasEnded(),
			reviewContent: review?.content,
			review
		});
		// Allow review writing if:
		// 1. There's an accepted offer
		// 2. Trip has ended
		// 3. Review hasn't been written yet (no content)
		return acceptedOffer && tripHasEnded() && !review?.content;
	});

	// State for offer actions
	let processingOfferId = $state<string | null>(null);
	let showPaymentModal = $state(false);
	let selectedOffer = $state<any>(null);
	let showOfferDetailModal = $state(false);
	let selectedOfferForDetail = $state<any>(null);

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

	function getStatusText(status: string) {
		return formatTripStatus(status);
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
		return formatOfferStatus(status);
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

	function openOfferDetail(offer: any) {
		selectedOfferForDetail = offer;
		showOfferDetailModal = true;
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

<div class="min-h-screen bg-white">
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
										{formatBudget(
											trip.budgetMin ? trip.budgetMin * 10000 : null
										)}{#if trip.budgetMin && trip.budgetMax}
											~
										{/if}{formatBudget(trip.budgetMax ? trip.budgetMax * 10000 : null)}
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
				{#if trip.customRequest || trip.additionalRequest}
					<div class="rounded-lg bg-white">
						<button
							class="flex w-full items-center justify-between p-4"
							onclick={() => (expandedSections.request = !expandedSections.request)}
						>
							<h2 class="text-base font-semibold text-gray-900">요청 사항</h2>
							<div class="h-5 w-5">
								<ChevronDown
									class="h-full w-full flex-shrink-0 text-gray-400 transition-transform {expandedSections.request
										? 'rotate-180'
										: ''}"
								/>
							</div>
						</button>
						{#if expandedSections.request}
							<div class="px-4 pb-4">
								<p class="text-sm text-gray-600">{trip.customRequest || trip.additionalRequest}</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Attached Files Section -->
				<!-- TODO: Uncomment when attachments feature is implemented
				{#if trip.attachments && trip.attachments.length > 0}
					<div class="rounded-lg bg-white">
						<button
							class="flex w-full items-center justify-between p-4"
							onclick={() => (expandedSections.files = !expandedSections.files)}>
							<h2 class="text-base font-semibold text-gray-900">첨부 파일</h2>
							<div class="h-5 w-5">
								<ChevronDown
									class="h-full w-full flex-shrink-0 text-gray-400 transition-transform {expandedSections.files
										? 'rotate-180'
										: ''}" />
							</div>
						</button>
						{#if expandedSections.files}
							<div class="px-4 pb-4">
								{#each trip.attachments as attachment}
									<div class="flex items-center justify-between rounded-lg bg-gray-50 p-3 mb-2">
										<div class="flex items-center gap-3">
											<img src={pdfIconUrl} alt="PDF" class="h-8 w-8" />
											<div>
												<p class="text-sm font-medium text-gray-900">{attachment.name}</p>
												<p class="text-xs text-gray-500">{attachment.size}</p>
											</div>
										</div>
										<button class="rounded-lg p-2 transition-colors hover:bg-gray-200">
											<img src={downloadIconUrl} alt="Download" class="h-5 w-5" />
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
				-->
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
						<div
							class="relative box-border flex w-full shrink-0 flex-col content-stretch items-start justify-start gap-1 p-0"
						>
							<div
								class="relative box-border flex w-full shrink-0 flex-row content-stretch items-center justify-between px-0 pt-3 pb-0"
							>
								<div
									class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-2 p-0"
								>
									<div
										class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-start gap-1 p-0 text-left text-[12px] leading-[0] font-bold text-nowrap not-italic"
									>
										<div class="relative shrink-0 text-[#052236]">
											<p class="block leading-[16px] text-nowrap whitespace-pre">전체</p>
										</div>
										<div class="relative shrink-0 text-[#1095f4]">
											<p class="block leading-[16px] text-nowrap whitespace-pre">{offers.length}</p>
										</div>
									</div>
								</div>
								<div
									class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-end gap-2 p-0"
								>
									<div
										class="relative box-border flex shrink-0 flex-row content-stretch items-center justify-end gap-1 p-0"
									>
										<div
											class="relative shrink-0 text-right text-[12px] leading-[0] font-medium text-nowrap text-[#052236] not-italic"
										>
											<p class="block leading-[18px] whitespace-pre">최신순</p>
										</div>
										<div class="relative flex h-[0px] w-[0px] shrink-0 items-center justify-center">
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
								onclick={() => openOfferDetail(offer)}
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

<!-- Bottom Button -->
<div
	class="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-gray-200 bg-white"
>
	<div class="flex items-center gap-3 px-4 py-3">
		<button
			class="h-5 w-5 -rotate-90 opacity-40"
			onclick={() => {
				/* Handle dots menu */
			}}
		>
			<img alt="More options" class="h-full w-full" src={dotsIconUrl} />
		</button>
		{#if offers.length === 0}
			<button
				onclick={() => goto(`/my-trips/${trip.id}/edit`)}
				class="flex h-12 flex-1 items-center justify-center rounded-[9px] bg-[#1095f4] px-6 py-3.5 text-sm font-semibold text-white"
			>
				계획 변경하기
			</button>
		{:else if acceptedOffer && canWriteReview()}
			<button
				onclick={async () => {
					console.log('Review button clicked', {
						review,
						reviewToken: review?.reviewToken
					});
					
					// If review token exists, navigate to review page
					if (review?.reviewToken) {
						goto(`/write-review/${review.reviewToken}`);
					} else {
						// Generate review token if it doesn't exist
						try {
							const response = await fetch(`/api/trips/${trip.id}/review-token/generate`, {
								method: 'POST'
							});
							
							if (response.ok) {
								const data = await response.json();
								if (data.reviewToken) {
									goto(`/write-review/${data.reviewToken}`);
								} else {
									console.error('Failed to generate review token');
									alert('리뷰 작성 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
								}
							} else {
								console.error('Failed to generate review token');
								alert('리뷰 작성 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
							}
						} catch (error) {
							console.error('Error generating review token:', error);
							alert('리뷰 작성 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
						}
					}
				}}
				class="flex h-12 flex-1 items-center justify-center gap-2.5 rounded-[9px] bg-[#19b989] px-6 py-3.5 text-sm font-semibold text-white"
			>
				<img src={starIconUrl} alt="star" class="h-4 w-4 brightness-0 invert" />
				리뷰 작성하기
			</button>
		{:else}
			<button
				onclick={() => goto('/chat')}
				class="flex h-12 flex-1 items-center justify-center gap-2.5 rounded-[9px] bg-[#1095f4] px-6 py-3.5 text-sm font-semibold text-white"
			>
				<img src={chatIconUrl} alt="chat" class="h-4 w-4 brightness-0 invert" />
				대화하기
			</button>
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

<!-- Offer Detail Modal -->
{#if selectedOfferForDetail}
	<OfferDetailModal
		isOpen={showOfferDetailModal}
		onClose={() => {
			showOfferDetailModal = false;
			selectedOfferForDetail = null;
		}}
		offer={selectedOfferForDetail}
		{trip}
		reviewToken={review?.reviewToken}
		onAccept={(offerId) => {
			showOfferDetailModal = false;
			handleOfferAction(offerId, 'accept');
		}}
		onReject={(offerId) => {
			showOfferDetailModal = false;
			handleOfferAction(offerId, 'reject');
		}}
		onStartChat={startConversation}
	/>
{/if}

<style>
	/* Ensure Lucide icons maintain their size */
	:global(.lucide) {
		flex-shrink: 0;
		width: 100%;
		height: 100%;
	}

	/* Fix for any oversized SVG icons */
	:global(svg) {
		max-width: 100%;
		max-height: 100%;
	}

	/* Specific fix for ChevronDown icons */
	:global(.lucide-chevron-down) {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>

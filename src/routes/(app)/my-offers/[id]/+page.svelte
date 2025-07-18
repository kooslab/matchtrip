<script lang="ts">
	import { goto } from '$app/navigation';
	import { Star } from 'lucide-svelte';
	import arrowBackIcon from '$lib/icons/icon-arrow-left-small-mono.svg';
	import chatIcon from '$lib/icons/bubble-chat.svg';
	import bookmarkIcon from '$lib/icons/icon-bookmark-mono.svg';
	import arrowRightIcon from '$lib/icons/icon-arrow-right-small-mono.svg';
	let { data } = $props();

	let offer = $derived(data.offer);
	let review = $state(data.review);
	let isRequestingReview = $state(false);
	let reviewRequestMessage = $state('');
	let reviewRequestError = $state('');
	let isMarkingCompleted = $state(false);
	let completionMessage = $state('');
	let completionError = $state('');
	
	// Check if trip has ended (end date is today or past)
	let tripHasEnded = $derived(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endDate = new Date(offer.trip.endDate);
		endDate.setHours(0, 0, 0, 0);
		return endDate <= today;
	});

	function formatDate(date: Date | string) {
		const d = new Date(date);
		return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}`;
	}

	function formatDateRange(startDate: Date | string, endDate: Date | string) {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
		return `${formatDate(start)} - ${formatDate(end)} ${nights}박 ${nights + 1}일`;
	}

	function formatTravelMethod(method: string) {
		const methods: Record<string, string> = {
			walking: '도보',
			driving: '자동차',
			publicTransport: '대중교통',
			mixed: '혼합'
		};
		return methods[method] || method;
	}

	function getStatusText(status: string) {
		const statuses: Record<string, string> = {
			pending: '검토 완료',
			accepted: '결제 완료',
			rejected: '거절됨',
			completed: '완료',
			cancelled: '취소됨'
		};
		return statuses[status] || status;
	}

	function getStatusColor(status: string) {
		const colors: Record<string, string> = {
			pending: 'bg-green-50 text-green-700',
			accepted: 'bg-blue-50 text-blue-700',
			rejected: 'bg-red-50 text-red-700',
			completed: 'bg-gray-50 text-gray-700',
			cancelled: 'bg-gray-50 text-gray-700'
		};
		return colors[status] || 'bg-gray-50 text-gray-700';
	}

	async function startConversation() {
		try {
			const response = await fetch('/api/conversations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					offerId: offer.id
				})
			});

			if (response.ok) {
				const { conversationId } = await response.json();
				goto(`/chat/${conversationId}`);
			} else {
				alert('대화를 시작할 수 없습니다.');
			}
		} catch (error) {
			alert('대화 시작 중 오류가 발생했습니다.');
		}
	}

	async function markTripCompleted() {
		if (!confirm('정말로 여행을 완료 처리하시겠습니까?')) {
			return;
		}

		isMarkingCompleted = true;
		completionMessage = '';
		completionError = '';

		try {
			const response = await fetch(`/api/trips/${offer.tripId}/complete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();

			if (response.ok) {
				window.location.reload();
			} else {
				completionError = data.error || '여행 완료 처리 중 오류가 발생했습니다.';
			}
		} catch (error) {
			completionError = '네트워크 오류가 발생했습니다.';
		} finally {
			isMarkingCompleted = false;
		}
	}

	async function requestReview() {
		if (!confirm('여행자에게 리뷰 요청을 보내시겠습니까?')) {
			return;
		}

		isRequestingReview = true;
		reviewRequestMessage = '';
		reviewRequestError = '';

		try {
			const response = await fetch(`/api/trips/${offer.tripId}/request-review`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const data = await response.json();

			if (response.ok) {
				reviewRequestMessage = '리뷰 요청이 성공적으로 전송되었습니다!';
				// Update review state to reflect the request was sent
				review = {
					...review,
					reviewRequestedAt: new Date().toISOString()
				};
			} else {
				reviewRequestError = data.error || '리뷰 요청 중 오류가 발생했습니다.';
			}
		} catch (error) {
			reviewRequestError = '네트워크 오류가 발생했습니다.';
		} finally {
			isRequestingReview = false;
		}
	}
</script>

<svelte:head>
	<title>{offer.destination.city}, {offer.destination.country} - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<div class="sticky top-0 z-10 bg-white shadow-sm">
		<div class="flex items-center h-[52px] px-4">
			<button
				onclick={() => goto('/my-offers')}
				class="-ml-1 p-1"
			>
				<img src={arrowBackIcon} alt="뒤로가기" class="h-6 w-6" />
			</button>
			<h1 class="flex-1 text-center text-[17px] font-semibold text-gray-900">
				{offer.destination.city}, {offer.destination.country}
			</h1>
			<button class="p-1">
				<img src={bookmarkIcon} alt="북마크" class="h-6 w-6 text-gray-400" />
			</button>
		</div>
	</div>

	<!-- Content -->
	<div class="pb-40">
		<!-- Status Badge -->
		<div class="px-4 pt-4">
			<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium {getStatusColor(offer.status)}">
				{getStatusText(offer.status)}
			</span>
		</div>

		<!-- Price Section -->
		<div class="px-4 pt-3">
			<div class="flex items-baseline gap-1">
				<span class="text-3xl font-bold text-gray-900">{offer.price.toLocaleString()}원</span>
				<span class="text-sm text-gray-600">/ 전체 금액</span>
			</div>
		</div>

		<!-- Info Grid -->
		<div class="px-4 pt-6">
			<dl class="space-y-3">
				<div class="flex justify-between">
					<dt class="text-sm text-gray-600">여행 일정</dt>
					<dd class="text-sm font-medium text-gray-900">
						{formatDateRange(offer.trip.startDate, offer.trip.endDate)}
					</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-sm text-gray-600">인원</dt>
					<dd class="text-sm font-medium text-gray-900">
						성인 {offer.trip.adultsCount || 0}명
						{#if offer.trip.childrenCount}
							· 아동 {offer.trip.childrenCount}명
						{/if}
					</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-sm text-gray-600">선호 스타일</dt>
					<dd class="text-sm font-medium text-gray-900">모험적인 여행</dd>
				</div>
				<div class="flex justify-between">
					<dt class="text-sm text-gray-600">관심 활동</dt>
					<dd class="text-sm font-medium text-gray-900">자연 / 아웃도어</dd>
				</div>
			</dl>
		</div>

		<!-- Expandable Sections -->
		<div class="mt-8">
			<!-- 제안 내용 -->
			<details class="border-t border-gray-200">
				<summary class="flex cursor-pointer items-center justify-between px-4 py-4 hover:bg-gray-50">
					<span class="text-base font-medium text-gray-900">제안 내용</span>
					<img src={arrowRightIcon} alt="" class="h-3 w-3 rotate-90 transition-transform" />
				</summary>
				<div class="px-4 pb-4">
					<p class="whitespace-pre-wrap text-sm text-gray-700">{offer.description || '제안 내용이 없습니다.'}</p>
				</div>
			</details>

			<!-- 첨부 파일 -->
			<details class="border-t border-gray-200">
				<summary class="flex cursor-pointer items-center justify-between px-4 py-4 hover:bg-gray-50">
					<span class="text-base font-medium text-gray-900">첨부 파일</span>
					<img src={arrowRightIcon} alt="" class="h-3 w-3 rotate-90 transition-transform" />
				</summary>
				<div class="px-4 pb-4">
					<div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
							<span class="text-xs font-bold text-white">PDF</span>
						</div>
						<div class="flex-1">
							<p class="text-sm font-medium text-gray-900">여행제안.pdf</p>
							<p class="text-xs text-gray-500">3MB</p>
						</div>
						<button class="p-2">
							<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
							</svg>
						</button>
					</div>
				</div>
			</details>

			<!-- 결제 정보 -->
			<details class="border-t border-gray-200">
				<summary class="flex cursor-pointer items-center justify-between px-4 py-4 hover:bg-gray-50">
					<span class="text-base font-medium text-gray-900">결제 정보</span>
					<img src={arrowRightIcon} alt="" class="h-3 w-3 rotate-90 transition-transform" />
				</summary>
				<div class="px-4 pb-4">
					<div class="rounded-lg bg-gray-50 p-4">
						<div class="mb-3 flex justify-between">
							<span class="text-sm text-gray-600">총 결제금액</span>
							<span class="text-base font-bold text-gray-900">{offer.price.toLocaleString()}원</span>
						</div>
						<button
							onclick={() => goto(`/my-trips/${offer.tripId}`)}
							class="w-full rounded-lg bg-gray-200 py-2 text-sm font-medium text-gray-700"
						>
							여행 취소하기
						</button>
					</div>
				</div>
			</details>

			<!-- 취소 / 환불 안내 -->
			<details class="border-t border-gray-200">
				<summary class="flex cursor-pointer items-center justify-between px-4 py-4 hover:bg-gray-50">
					<span class="text-base font-medium text-gray-900">취소 / 환불 안내</span>
					<img src={arrowRightIcon} alt="" class="h-3 w-3 rotate-90 transition-transform" />
				</summary>
				<div class="px-4 pb-4">
					<p class="text-sm text-gray-700">취소 및 환불 정책 내용이 여기에 표시됩니다.</p>
				</div>
			</details>

			<!-- 판매자 정보 및 고시 -->
			<details class="border-t border-gray-200 border-b">
				<summary class="flex cursor-pointer items-center justify-between px-4 py-4 hover:bg-gray-50">
					<span class="text-base font-medium text-gray-900">판매자 정보 및 고시</span>
					<img src={arrowRightIcon} alt="" class="h-3 w-3 rotate-90 transition-transform" />
				</summary>
				<div class="px-4 pb-4">
					<p class="text-sm text-gray-700">판매자 정보 및 고시 내용이 여기에 표시됩니다.</p>
				</div>
			</details>
		</div>

	</div>

	<!-- Fixed Bottom Section -->
	<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
		<div class="flex items-center gap-3 px-4 py-3 pb-safe">
			<!-- Price Section -->
			<div class="flex-1">
				<p class="text-xs text-gray-600">총 결제금액</p>
				<p class="text-lg font-bold text-gray-900">{offer.price.toLocaleString()}원</p>
			</div>
			
			<!-- Button Section -->
			{#if offer.status === 'accepted' && tripHasEnded()}
				{#if review?.reviewRequestedAt}
					<button
						disabled
						class="flex items-center justify-center gap-2 rounded-xl bg-gray-400 px-8 py-3.5 text-base font-semibold text-white cursor-not-allowed"
					>
						<Star class="h-5 w-5" />
						요청 전송됨
					</button>
				{:else}
					<button
						onclick={requestReview}
						disabled={isRequestingReview}
						class="flex items-center justify-center gap-2 rounded-xl bg-[#1095f4] px-8 py-3.5 text-base font-semibold text-white disabled:opacity-50"
					>
						{#if isRequestingReview}
							<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							요청 중...
						{:else}
							<Star class="h-5 w-5" />
							리뷰 요청하기
						{/if}
					</button>
				{/if}
			{:else if offer.status === 'pending' || offer.status === 'accepted'}
				<button
					onclick={startConversation}
					class="flex items-center justify-center gap-2 rounded-xl bg-[#1095f4] px-8 py-3.5 text-base font-semibold text-white"
				>
					<img src={chatIcon} alt="" class="h-5 w-5 brightness-0 invert" />
					대화하기
				</button>
			{:else if offer.status === 'completed'}
				{#if review?.reviewRequestedAt}
					<button
						disabled
						class="flex items-center justify-center gap-2 rounded-xl bg-gray-400 px-8 py-3.5 text-base font-semibold text-white cursor-not-allowed"
					>
						<Star class="h-5 w-5" />
						요청 전송됨
					</button>
				{:else}
					<button
						onclick={requestReview}
						disabled={isRequestingReview}
						class="flex items-center justify-center gap-2 rounded-xl bg-[#1095f4] px-8 py-3.5 text-base font-semibold text-white disabled:opacity-50"
					>
						{#if isRequestingReview}
							<span class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							요청 중...
						{:else}
							<Star class="h-5 w-5" />
							리뷰 요청하기
						{/if}
					</button>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style>
	details[open] summary img {
		transform: rotate(-90deg);
	}
	
	details summary::-webkit-details-marker {
		display: none;
	}
</style>
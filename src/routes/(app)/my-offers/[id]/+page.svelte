<script lang="ts">
	import { goto } from '$app/navigation';
	import { MessageSquare, Star } from 'lucide-svelte';
	let { data } = $props();

	let offer = $derived(data.offer);
	let isRequestingReview = $state(false);
	let reviewRequestMessage = $state('');
	let reviewRequestError = $state('');
	let isMarkingCompleted = $state(false);
	let completionMessage = $state('');
	let completionError = $state('');

	function formatDate(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatDateTime(date: Date | string) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj.toLocaleString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			case 'accepted':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'rejected':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'draft':
				return 'bg-gray-100 text-gray-800 border-gray-200';
			case 'submitted':
				return 'bg-blue-100 text-blue-800 border-blue-200';
			case 'completed':
				return 'bg-purple-100 text-purple-800 border-purple-200';
			case 'cancelled':
				return 'bg-red-100 text-red-800 border-red-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
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
			case 'draft':
				return '임시저장';
			case 'submitted':
				return '제출됨';
			case 'completed':
				return '완료됨';
			case 'cancelled':
				return '취소됨';
			default:
				return status;
		}
	}

	function formatDuration(hours: number | null) {
		if (!hours) return '미정';
		if (hours < 24) return `${hours}시간`;
		const days = Math.floor(hours / 24);
		const remainingHours = hours % 24;
		if (remainingHours === 0) return `${days}일`;
		return `${days}일 ${remainingHours}시간`;
	}

	async function startConversation() {
		try {
			const response = await fetch('/api/conversations', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ offerId: offer.id })
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

	async function markTripCompleted() {
		isMarkingCompleted = true;
		completionError = '';
		completionMessage = '';

		try {
			const response = await fetch(`/api/trips/${offer.tripId}/complete`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();

			if (response.ok) {
				completionMessage = '여행이 완료 처리되었습니다!';
				// Reload the page to update the status
				setTimeout(() => {
					location.reload();
				}, 1500);
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
		isRequestingReview = true;
		reviewRequestError = '';
		reviewRequestMessage = '';

		try {
			const response = await fetch('/api/reviews/request', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tripId: offer.tripId })
			});

			const data = await response.json();

			if (response.ok) {
				reviewRequestMessage = '리뷰 요청이 성공적으로 전송되었습니다!';
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
	<title>제안 상세보기 - MatchTrip</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header with back button -->
	<div class="mb-6 flex items-center gap-4">
		<button
			onclick={() => goto('/my-offers')}
			class="flex items-center gap-2 text-gray-600 hover:text-gray-800">
			<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
			</svg>
			나의 제안으로 돌아가기
		</button>
	</div>

	<!-- Main Content -->
	<div class="grid gap-8 lg:grid-cols-3">
		<!-- Left Column - Trip & Traveler Info -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Trip Overview -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<div class="mb-4 flex items-start justify-between">
					<div>
						<h1 class="mb-2 text-2xl font-bold text-gray-900">
							{offer.destination.city}, {offer.destination.country}
						</h1>
						<p class="text-gray-600">{offer.traveler.name}님의 여행</p>
					</div>
					<span
						class="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium {getStatusColor(
							offer.status
						)}">
						{getStatusText(offer.status)}
					</span>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-900">여행 기간</h3>
						<p class="text-gray-700">
							📅 {formatDate(offer.trip.startDate)} - {formatDate(offer.trip.endDate)}
						</p>
					</div>
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-900">참가자</h3>
						<p class="text-gray-700">
							👥 성인 {offer.trip.adultsCount}명
							{#if offer.trip.childrenCount > 0}
								, 아동 {offer.trip.childrenCount}명
							{/if}
						</p>
					</div>
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-900">이동 방법</h3>
						<p class="text-gray-700">🚶 {formatTravelMethod(offer.trip.travelMethod)}</p>
					</div>
					<div>
						<h3 class="mb-2 text-sm font-medium text-gray-900">여행 상태</h3>
						<p class="text-gray-700">
							<span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusColor(offer.trip.status)}">
								{getStatusText(offer.trip.status)}
							</span>
						</p>
					</div>
				</div>

				{#if offer.trip.customRequest}
					<div class="mt-6">
						<h3 class="mb-2 text-sm font-medium text-gray-900">특별 요청사항</h3>
						<div class="rounded-md bg-gray-50 p-4">
							<p class="whitespace-pre-wrap text-gray-700">{offer.trip.customRequest}</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Traveler Information -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">여행자 정보</h2>
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<h3 class="mb-1 text-sm font-medium text-gray-900">이름</h3>
						<p class="text-gray-700">{offer.traveler.name}</p>
					</div>
					<div>
						<h3 class="mb-1 text-sm font-medium text-gray-900">이메일</h3>
						<p class="text-gray-700">{offer.traveler.email}</p>
					</div>
				</div>
			</div>

			<!-- Itinerary -->
			{#if offer.itinerary}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">제안한 여행 일정</h2>
					<div class="prose prose-sm max-w-none rounded-md bg-blue-50 p-4">
						{@html offer.itinerary}
					</div>
				</div>
			{/if}
		</div>

		<!-- Right Column - Offer Details -->
		<div class="space-y-6">
			<!-- Offer Summary -->
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">제안 정보</h2>

				<!-- Price -->
				<div class="mb-6 rounded-lg bg-blue-50 p-4 text-center">
					<p class="text-sm text-blue-600">제안 금액</p>
					<p class="text-3xl font-bold text-blue-900">
						{offer.price.toLocaleString('ko-KR')}원
					</p>
					{#if offer.currency !== 'KRW'}
						<p class="text-xs text-blue-600">({offer.currency})</p>
					{/if}
				</div>

				<div class="space-y-4">
					<div>
						<h3 class="mb-1 text-sm font-medium text-gray-900">제안 제목</h3>
						<p class="text-gray-700">{offer.title}</p>
					</div>

					{#if offer.description}
						<div>
							<h3 class="mb-1 text-sm font-medium text-gray-900">제안 설명</h3>
							<p class="whitespace-pre-wrap text-gray-700">{offer.description}</p>
						</div>
					{/if}

					{#if offer.duration}
						<div>
							<h3 class="mb-1 text-sm font-medium text-gray-900">예상 소요시간</h3>
							<p class="text-gray-700">{formatDuration(offer.duration)}</p>
						</div>
					{/if}

					{#if offer.maxParticipants}
						<div>
							<h3 class="mb-1 text-sm font-medium text-gray-900">최대 참가자</h3>
							<p class="text-gray-700">{offer.maxParticipants}명</p>
						</div>
					{/if}

					<div>
						<h3 class="mb-1 text-sm font-medium text-gray-900">제안일</h3>
						<p class="text-gray-700">{formatDateTime(offer.createdAt)}</p>
					</div>

					{#if offer.updatedAt !== offer.createdAt}
						<div>
							<h3 class="mb-1 text-sm font-medium text-gray-900">수정일</h3>
							<p class="text-gray-700">{formatDateTime(offer.updatedAt)}</p>
						</div>
					{/if}

					{#if offer.validUntil}
						<div>
							<h3 class="mb-1 text-sm font-medium text-gray-900">제안 유효기간</h3>
							<p class="text-gray-700">{formatDateTime(offer.validUntil)}까지</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Status Messages -->
			{#if completionMessage}
				<div class="rounded-lg bg-green-50 p-4 text-green-700 text-sm">
					{completionMessage}
				</div>
			{/if}
			
			{#if completionError}
				<div class="rounded-lg bg-red-50 p-4 text-red-700 text-sm">
					{completionError}
				</div>
			{/if}

			{#if reviewRequestMessage}
				<div class="rounded-lg bg-green-50 p-4 text-green-700 text-sm">
					{reviewRequestMessage}
				</div>
			{/if}
			
			{#if reviewRequestError}
				<div class="rounded-lg bg-red-50 p-4 text-red-700 text-sm">
					{reviewRequestError}
				</div>
			{/if}

			<!-- Action Buttons -->
			<div class="space-y-3">
				<!-- Conversation Button -->
				<button
					onclick={startConversation}
					class="w-full flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
					<MessageSquare class="h-5 w-5" />
					대화하기
				</button>

				{#if offer.status === 'accepted'}
					<button
						onclick={() => goto(`/my-trips/${offer.tripId}`)}
						class="w-full rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none">
						여행 관리하기
					</button>

					{#if offer.trip.status === 'accepted'}
						{#if new Date(offer.trip.endDate) < new Date()}
							<button
								onclick={markTripCompleted}
								disabled={isMarkingCompleted}
								class="w-full flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
								{#if isMarkingCompleted}
									<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
									처리 중...
								{:else}
									여행 완료 처리
								{/if}
							</button>
						{:else}
							<!-- Show during trip for testing -->
							<button
								onclick={markTripCompleted}
								disabled={isMarkingCompleted}
								class="w-full flex items-center justify-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
								{#if isMarkingCompleted}
									<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
									처리 중...
								{:else}
									여행 조기 완료 (테스트용)
								{/if}
							</button>
						{/if}
					{/if}
				{/if}

				{#if offer.status === 'accepted' && offer.trip.status === 'completed'}
					<button
						onclick={requestReview}
						disabled={isRequestingReview}
						class="w-full flex items-center justify-center gap-2 rounded-md bg-yellow-600 px-4 py-2 text-white transition-colors hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
						{#if isRequestingReview}
							<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
							요청 중...
						{:else}
							<Star class="h-5 w-5" />
							리뷰 요청하기
						{/if}
					</button>
				{/if}

				<button
					onclick={() => goto('/my-offers')}
					class="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
					목록으로 돌아가기
				</button>
			</div>
		</div>
	</div>
</div>

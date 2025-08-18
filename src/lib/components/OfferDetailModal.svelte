<script lang="ts">
	import { X, Star } from 'lucide-svelte';
	import { formatKoreanDate, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import { goto } from '$app/navigation';
	import ReviewsList from './ReviewsList.svelte';
	import starIconUrl from '$lib/icons/icon-star-mono.svg';
	import locationIconUrl from '$lib/icons/icon-pin-location-mono.svg';
	import calendarIconUrl from '$lib/icons/icon-calendar-check-mono.svg';
	import usersIconUrl from '$lib/icons/icon-user-two-mono.svg';
	import moneyIconUrl from '$lib/icons/icon-coin-mono.svg';
	import moneyOutIconUrl from '$lib/icons/icon-money-out-mono.svg';
	import chatIconUrl from '$lib/icons/icon-chat-bubble-dots-mono.svg';
	import pencilIconUrl from '$lib/icons/icon-pencil-mono-1.svg';
	import { TRAVEL_STYLES, ACTIVITY_TYPES, OFFER_STATUS } from '$lib/constants/travel';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		offer: {
			id: string;
			price: number;
			itinerary: string;
			status: string;
			createdAt: string;
			guide?: {
				id: string;
				name: string;
				email: string;
			};
			guideProfile?: {
				profileImageUrl?: string;
				avgRating?: number;
				acceptedOffersCount?: number;
				currentLocation?: string;
				guideAreas?: string;
				languages?: string[];
				experience?: string;
				introduction?: string;
			};
		};
		trip: {
			id: string;
			startDate: string;
			endDate: string;
			adultsCount: number;
			childrenCount: number | null;
			destination: {
				city: string;
				country: string;
			} | null;
			travelStyle?: string | null;
			activities?: string[] | null;
		};
		onAccept: (offerId: string) => void;
		onReject: (offerId: string) => void;
		onStartChat: (offerId: string) => void;
		reviewToken?: string | null;
	}

	let {
		isOpen,
		onClose,
		offer,
		trip,
		onAccept,
		onReject,
		onStartChat,
		reviewToken = null
	}: Props = $props();

	// Tab state
	let activeTab = $state<'offer' | 'guide' | 'review'>('offer');

	// Collapsible state
	let itineraryExpanded = $state(true);

	function formatPrice(amount: number): string {
		return `₩${amount.toLocaleString()}`;
	}

	function calculateNightsAndDays(startDate: Date | string, endDate: Date | string) {
		const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
		const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		const days = nights + 1;
		return `${nights}박 ${days}일`;
	}

	function formatDate(date: string | Date) {
		const dateObj = typeof date === 'string' ? new Date(date) : date;
		return dateObj
			.toLocaleDateString('ko-KR', {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			})
			.replace(/\. /g, '. ')
			.replace(/\.$/, '');
	}

	function formatTravelStyle(style: string | null | undefined) {
		if (!style) return '미정';
		return TRAVEL_STYLES[style as keyof typeof TRAVEL_STYLES] || style;
	}

	function formatActivities(activities: string[] | null | undefined) {
		if (!activities || activities.length === 0) return '미정';

		const activityMap: Record<string, string> = {
			'city-tour': '시내투어',
			'suburb-tour': '근교투어',
			'snap-photo': '스냅사진',
			'vehicle-tour': '차량투어',
			'airport-pickup': '공항픽업',
			'bus-charter': '버스대절',
			interpretation: '통역 서비스',
			...ACTIVITY_TYPES
		};

		return activities.map((activity) => activityMap[activity] || activity).join(' / ');
	}

	function getStatusBadge(status: string) {
		const statusMap: Record<string, { text: string; color: string }> = {
			pending: { text: OFFER_STATUS.pending, color: 'bg-green-500' },
			accepted: { text: OFFER_STATUS.accepted, color: 'bg-blue-500' },
			rejected: { text: OFFER_STATUS.rejected, color: 'bg-red-500' },
			withdrawn: { text: OFFER_STATUS.withdrawn, color: 'bg-gray-500' }
		};

		return statusMap[status] || { text: status, color: 'bg-gray-500' };
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div class="bg-opacity-30 fixed inset-0 z-40 bg-black" aria-hidden="true"></div>

	<!-- Modal Container -->
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<button class="absolute inset-0" onclick={onClose} aria-label="Close modal"></button>

		<!-- Modal Content -->
		<div
			class="animate-slide-up relative w-full max-w-lg rounded-t-3xl bg-white shadow-xl"
			style="height: 90vh; max-height: 90vh;"
		>
			<!-- Header -->
			<div class="sticky top-0 z-10 rounded-t-3xl bg-white">
				<div class="flex items-center justify-between border-b border-gray-100 p-4">
					<h2 class="text-lg font-semibold text-gray-900">제안 상세</h2>
					<button onclick={onClose} class="rounded-full p-1.5 transition-colors hover:bg-gray-100">
						<X class="h-5 w-5 text-gray-600" />
					</button>
				</div>

				<!-- Tabs -->
				<div class="flex">
					<button
						class="relative flex-1 py-3.5 text-sm font-medium transition-all {activeTab === 'offer'
							? 'text-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
						onclick={() => (activeTab = 'offer')}
					>
						제안 정보
						{#if activeTab === 'offer'}
							<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900"></div>
						{/if}
					</button>
					<button
						class="relative flex-1 py-3.5 text-sm font-medium transition-all {activeTab === 'guide'
							? 'text-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
						onclick={() => (activeTab = 'guide')}
					>
						가이드 정보
						{#if activeTab === 'guide'}
							<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900"></div>
						{/if}
					</button>
					<button
						class="relative flex-1 py-3.5 text-sm font-medium transition-all {activeTab === 'review'
							? 'text-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
						onclick={() => (activeTab = 'review')}
					>
						리뷰
						{#if activeTab === 'review'}
							<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900"></div>
						{/if}
					</button>
				</div>
			</div>

			<!-- Scrollable Content -->
			<div class="overflow-y-auto" style="height: calc(90vh - 200px);">
				{#if activeTab === 'offer'}
					{@const statusInfo = getStatusBadge(offer.status)}
					<!-- Offer Info Tab -->
					<div>
						<!-- Price Header with Badge -->
						<div class="px-5 pt-6 pb-8">
							<div
								class="inline-flex items-center {statusInfo.color} mb-4 rounded px-2.5 py-1 text-xs font-medium text-white"
							>
								{statusInfo.text}
							</div>
							<div class="flex items-baseline gap-2">
								<h2 class="text-3xl font-bold text-gray-900">{offer.price.toLocaleString()}원</h2>
								<span class="text-base text-gray-500">총 금액</span>
							</div>
						</div>

						<!-- Trip Details Grid -->
						<div class="px-5 pb-6">
							<div class="space-y-5">
								<!-- Row 1 -->
								<div class="flex items-center justify-between">
									<p class="text-sm text-gray-500">남은 기간</p>
									<p class="text-sm text-gray-900">
										{(() => {
											const now = new Date();
											const start = new Date(trip.startDate);
											const diffTime = start.getTime() - now.getTime();
											const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
											return diffDays > 0 ? `${diffDays}일` : '0일';
										})()}
									</p>
								</div>

								<!-- Row 2 -->
								<div class="flex items-center justify-between gap-4">
									<p class="flex-shrink-0 text-sm text-gray-500">여행 일정</p>
									<div class="flex items-center gap-2">
										<p class="text-sm text-gray-900">
											{formatKoreanDate(trip.startDate)} ~ {formatKoreanDate(trip.endDate)}
										</p>
										<p class="text-sm text-blue-600">
											{calculateNightsAndDays(trip.startDate, trip.endDate)}
										</p>
									</div>
								</div>

								<!-- Row 3 -->
								<div class="flex items-center justify-between">
									<p class="text-sm text-gray-500">인원</p>
									<p class="text-sm text-gray-900">
										성인 {trip.adultsCount}명{trip.childrenCount
											? ` · 아동 ${trip.childrenCount}명`
											: ''}
									</p>
								</div>

								<!-- Row 4 -->
								<div class="flex items-center justify-between">
									<p class="text-sm text-gray-500">선호 스타일</p>
									<p class="text-sm text-gray-900">{formatTravelStyle(trip.travelStyle)}</p>
								</div>

								<!-- Row 5 -->
								<div class="flex items-center justify-between">
									<p class="text-sm text-gray-500">관심 활동</p>
									<p class="text-sm text-gray-900">{formatActivities(trip.activities)}</p>
								</div>
							</div>
						</div>

						<!-- Divider -->
						<div class="mx-5 h-px bg-gray-200"></div>

						<!-- Itinerary Section -->
						<div class="px-5 py-6">
							<button
								class="flex w-full items-center justify-between"
								onclick={() => (itineraryExpanded = !itineraryExpanded)}
							>
								<h4 class="font-semibold text-gray-900">제안 내용</h4>
								<div class="h-5 w-5 flex-shrink-0">
									<svg
										class="h-full w-full transform text-gray-400 transition-transform {itineraryExpanded
											? 'rotate-180'
											: ''}"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										></path>
									</svg>
								</div>
							</button>
							{#if itineraryExpanded}
								<div class="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
									{@html offer.itinerary}
								</div>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'guide'}
					<!-- Guide Info Tab -->
					<div class="flex h-full flex-col">
						{#if offer.guide && offer.guideProfile}
							<!-- Guide Profile Section -->
							<div class="flex items-center gap-4 px-5 py-6">
								<div
									class="h-20 w-20 flex-shrink-0 rounded-full bg-blue-100 bg-cover bg-center"
									style={offer.guideProfile?.profileImageUrl
										? `background-image: url('${offer.guideProfile.profileImageUrl}')`
										: ''}
								>
									{#if !offer.guideProfile?.profileImageUrl}
										<div class="flex h-full w-full items-center justify-center text-2xl text-white">
											<svg class="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
												<path
													d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
												/>
											</svg>
										</div>
									{/if}
								</div>
								<div class="flex-1">
									<h3 class="mb-1 text-xl font-semibold text-gray-900">{offer.guide.name}</h3>
									<div class="flex items-center gap-2">
										<div class="flex items-center gap-0.5">
											{#each [1, 2, 3, 4, 5] as star}
												<svg
													class="h-4 w-4 {star <= Math.round(offer.guideProfile?.avgRating || 0)
														? 'fill-yellow-400 text-yellow-400'
														: 'text-gray-300'}"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
													/>
												</svg>
											{/each}
											<span class="ml-1 text-sm font-medium text-gray-700">
												{offer.guideProfile?.avgRating?.toFixed(1) || '0.0'}
											</span>
										</div>
										<span class="text-sm text-gray-500">
											{offer.guideProfile?.acceptedOffersCount || 0}건 여행 진행
										</span>
									</div>
								</div>
								<button
									class="rounded-full bg-green-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600"
								>
									팔로우
								</button>
							</div>

							<!-- Guide Info Section -->
							{#if offer.guideProfile?.introduction}
								<div class="px-5 pb-6">
									<button
										class="flex w-full items-center justify-between"
										onclick={() => {
											/* Toggle guide info */
										}}
									>
										<h4 class="font-semibold text-gray-900">가이드 정보</h4>
										<div class="h-5 w-5 flex-shrink-0">
											<svg
												class="h-full w-full rotate-180 transform text-gray-400"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M19 9l-7 7-7-7"
												></path>
											</svg>
										</div>
									</button>
									<div class="prose prose-sm mt-4 max-w-none text-sm leading-relaxed text-gray-600">
										{@html offer.guideProfile.introduction}
									</div>
								</div>
							{:else}
								<div class="px-5 pb-6">
									<p class="text-center text-sm text-gray-500">
										가이드 소개가 아직 작성되지 않았습니다.
									</p>
								</div>
							{/if}

							<!-- Photos Section -->
							<div class="mx-5 mb-6 flex flex-1 items-center justify-center rounded-lg bg-gray-50">
								<div class="text-center">
									<svg
										class="mx-auto mb-2 h-16 w-16 text-gray-300"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
										/>
									</svg>
									<p class="text-sm text-gray-400">사진이 없습니다</p>
								</div>
							</div>
						{:else}
							<!-- Empty State -->
							<div class="flex flex-1 items-center justify-center px-5">
								<div class="text-center">
									<svg
										class="mx-auto mb-4 h-20 w-20 text-gray-300"
										viewBox="0 0 24 24"
										fill="currentColor"
									>
										<path
											d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
										/>
									</svg>
									<h3 class="mb-2 text-lg font-medium text-gray-900">가이드 정보가 없습니다</h3>
									<p class="text-sm text-gray-500">아직 가이드 프로필이 등록되지 않았습니다.</p>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<!-- Reviews Tab -->
					<div class="flex h-full flex-col">
						{#if offer.guide?.id}
							<!-- Guide Profile Header -->
							<div class="border-b border-gray-100 px-5 py-4">
								<h3 class="mb-3 text-lg font-semibold">여행자 후기</h3>
								<div class="flex items-center gap-4">
									<div
										class="h-16 w-16 flex-shrink-0 rounded-full bg-blue-100 bg-cover bg-center"
										style={offer.guideProfile?.profileImageUrl
											? `background-image: url('${offer.guideProfile.profileImageUrl}')`
											: ''}
									>
										{#if !offer.guideProfile?.profileImageUrl}
											<div class="flex h-full w-full items-center justify-center text-white">
												<svg class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
													<path
														d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
													/>
												</svg>
											</div>
										{/if}
									</div>
									<div class="flex-1">
										<h4 class="font-semibold text-gray-900">{offer.guide?.name || '가이드'}</h4>
										{#if offer.guideProfile?.avgRating}
											<div class="flex items-center gap-2">
												<div class="flex items-center gap-0.5">
													{#each [1, 2, 3, 4, 5] as star}
														<svg
															class="h-4 w-4 {star <= Math.round(offer.guideProfile.avgRating || 0)
																? 'fill-yellow-400 text-yellow-400'
																: 'text-gray-300'}"
															viewBox="0 0 20 20"
															fill="currentColor"
														>
															<path
																d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
															/>
														</svg>
													{/each}
												</div>
												<span class="text-sm font-medium text-gray-700">
													{offer.guideProfile.avgRating?.toFixed(1) || '0.0'}
												</span>
											</div>
										{/if}
									</div>
								</div>
							</div>

							<!-- Reviews List -->
							<div class="flex-1 overflow-y-auto px-5 py-4">
								<ReviewsList guideId={offer.guide.id} showSummary={false} />
							</div>
						{:else}
							<div class="flex flex-1 items-center justify-center">
								<p class="text-gray-500">가이드 정보를 불러올 수 없습니다.</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Bottom Actions -->
			<div class="sticky bottom-0 border-t border-gray-200 bg-white p-4">
				{#if activeTab === 'guide'}
					<!-- Chat button for guide tab -->
					<button
						onclick={() => onStartChat(offer.id)}
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1095f4] py-4 font-medium text-white transition-colors hover:bg-blue-600"
					>
						<img src={chatIconUrl} alt="chat" class="h-5 w-5 flex-shrink-0 brightness-0 invert" />
						<span class="text-base">대화하기</span>
					</button>
				{:else if activeTab === 'offer'}
					<!-- Payment section for offer tab -->
					{#if offer.status === 'pending'}
						<div class="flex items-center gap-4">
							<div class="w-1/3">
								<p class="mb-1 text-xs text-gray-500">총 금액</p>
								<p class="text-xl font-bold text-gray-900">{offer.price.toLocaleString()}원</p>
							</div>
							<button
								onclick={() => onAccept(offer.id)}
								class="flex w-2/3 items-center justify-center gap-2 rounded-xl bg-[#1095f4] py-4 font-medium text-white transition-colors hover:bg-blue-600"
							>
								<img src={moneyOutIconUrl} alt="payment" class="h-5 w-5 brightness-0 invert" />
								<span>결제하기</span>
							</button>
						</div>
					{:else if offer.status === 'accepted'}
						<button
							onclick={() => onStartChat(offer.id)}
							class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1095f4] py-4 font-medium text-white transition-colors hover:bg-blue-600"
						>
							<img src={chatIconUrl} alt="chat" class="h-5 w-5 flex-shrink-0 brightness-0 invert" />
							<span class="text-base">대화하기</span>
						</button>
					{:else}
						<div class="rounded-lg bg-gray-100 px-6 py-3 text-center">
							<span class="text-gray-600">
								{offer.status === 'rejected' ? '거절된 제안입니다' : '처리된 제안입니다'}
							</span>
						</div>
					{/if}
				{:else if activeTab === 'review'}
					<!-- Write review button for review tab -->
					<button
						onclick={() => {
							if (reviewToken) {
								goto(`/write-review/${reviewToken}`);
								onClose();
							} else {
								alert('리뷰를 작성하려면 먼저 가이드가 리뷰 요청을 보내야 합니다.');
							}
						}}
						class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1095f4] py-4 font-medium text-white transition-colors hover:bg-blue-600"
					>
						<img src={pencilIconUrl} alt="write review" class="h-5 w-5 brightness-0 invert" />
						<span>리뷰 작성</span>
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>

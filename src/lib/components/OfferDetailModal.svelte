<script lang="ts">
	import { X, Star } from 'lucide-svelte';
	import { formatKoreanDate, formatKoreanDateRange } from '$lib/utils/dateFormatter';
	import starIconUrl from '$lib/icons/icon-star-mono.svg';
	import locationIconUrl from '$lib/icons/icon-pin-location-mono.svg';
	import calendarIconUrl from '$lib/icons/icon-calendar-check-mono.svg';
	import usersIconUrl from '$lib/icons/icon-user-two-mono.svg';
	import moneyIconUrl from '$lib/icons/icon-coin-mono.svg';
	import moneyOutIconUrl from '$lib/icons/icon-money-out-mono.svg';
	import chatIconUrl from '$lib/icons/icon-chat-bubble-dots-mono.svg';
	import pencilIconUrl from '$lib/icons/icon-pencil-mono-1.svg';

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
	}

	let { isOpen, onClose, offer, trip, onAccept, onReject, onStartChat }: Props = $props();
	
	// Tab state
	let activeTab = $state<'offer' | 'guide' | 'review'>('offer');
	
	// Collapsible state
	let itineraryExpanded = $state(true);

	function formatPrice(amount: number): string {
		if (amount >= 10000) {
			const manWon = amount / 10000;
			if (manWon % 1 === 0) {
				return `${manWon.toLocaleString()}만원`;
			} else {
				return `${manWon.toFixed(1)}만원`;
			}
		} else {
			return `${amount.toLocaleString()}원`;
		}
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
		return dateObj.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).replace(/\. /g, '. ').replace(/\.$/, '');
	}
	
	function formatTravelStyle(style: string | null | undefined) {
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
	
	function formatActivities(activities: string[] | null | undefined) {
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
	
	function getStatusBadge(status: string) {
		const statusMap: Record<string, { text: string; color: string }> = {
			pending: { text: '검토중', color: 'bg-green-500' },
			accepted: { text: '수락됨', color: 'bg-blue-500' },
			rejected: { text: '거절됨', color: 'bg-red-500' },
			withdrawn: { text: '철회됨', color: 'bg-gray-500' }
		};
		
		return statusMap[status] || { text: status, color: 'bg-gray-500' };
	}
</script>

{#if isOpen}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-40 bg-black bg-opacity-30" aria-hidden="true"></div>
	
	<!-- Modal Container -->
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<button
			class="absolute inset-0"
			onclick={onClose}
			aria-label="Close modal"
		></button>
		
		<!-- Modal Content -->
		<div class="relative bg-white w-full max-w-lg rounded-t-3xl shadow-xl animate-slide-up" style="height: 90vh; max-height: 90vh;">
			<!-- Header -->
			<div class="sticky top-0 z-10 bg-white rounded-t-3xl">
				<div class="flex items-center justify-between p-4 border-b border-gray-100">
					<h2 class="text-lg font-semibold text-gray-900">제안 상세</h2>
					<button
						onclick={onClose}
						class="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
					>
						<X class="w-5 h-5 text-gray-600" />
					</button>
				</div>
				
				<!-- Tabs -->
				<div class="flex">
					<button
						class="flex-1 py-3.5 text-sm font-medium transition-all relative {activeTab === 'offer'
							? 'text-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
						onclick={() => (activeTab = 'offer')}
					>
						제안 정보
						{#if activeTab === 'offer'}
							<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
						{/if}
					</button>
					<button
						class="flex-1 py-3.5 text-sm font-medium transition-all relative {activeTab === 'guide'
							? 'text-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
						onclick={() => (activeTab = 'guide')}
					>
						가이드 정보
						{#if activeTab === 'guide'}
							<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
						{/if}
					</button>
					<button
						class="flex-1 py-3.5 text-sm font-medium transition-all relative {activeTab === 'review'
							? 'text-gray-900'
							: 'text-gray-500 hover:text-gray-700'}"
						onclick={() => (activeTab = 'review')}
					>
						리뷰
						{#if activeTab === 'review'}
							<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
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
							<div class="inline-flex items-center {statusInfo.color} text-white text-xs font-medium px-2.5 py-1 rounded mb-4">
								{statusInfo.text}
							</div>
							<div class="flex items-baseline gap-2">
								<h2 class="text-3xl font-bold text-gray-900">{offer.price.toLocaleString()}원</h2>
								<span class="text-gray-500 text-base">총 금액</span>
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
									<p class="text-sm text-gray-500 flex-shrink-0">여행 일정</p>
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
										성인 {trip.adultsCount}명{trip.childrenCount ? ` · 아동 ${trip.childrenCount}명` : ''}
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
						<div class="h-px bg-gray-200 mx-5"></div>

						<!-- Itinerary Section -->
						<div class="px-5 py-6">
							<button 
								class="w-full flex items-center justify-between"
								onclick={() => itineraryExpanded = !itineraryExpanded}
							>
								<h4 class="font-semibold text-gray-900">제안 내용</h4>
								<div class="w-5 h-5 flex-shrink-0">
									<svg class="w-full h-full text-gray-400 transform transition-transform {itineraryExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
									</svg>
								</div>
							</button>
							{#if itineraryExpanded}
								<div class="mt-4 text-sm text-gray-700 leading-relaxed space-y-3">
									{@html offer.itinerary}
								</div>
							{/if}
						</div>
					</div>
				{:else if activeTab === 'guide'}
					<!-- Guide Info Tab -->
					<div class="flex flex-col h-full">
						{#if offer.guide && offer.guideProfile}
							<!-- Guide Profile Section -->
							<div class="flex items-center gap-4 px-5 py-6">
								<div
									class="w-20 h-20 rounded-full bg-blue-100 bg-cover bg-center flex-shrink-0"
									style={offer.guideProfile?.profileImageUrl ? `background-image: url('${offer.guideProfile.profileImageUrl}')` : ''}
								>
									{#if !offer.guideProfile?.profileImageUrl}
										<div class="flex items-center justify-center w-full h-full text-white text-2xl">
											<svg class="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
												<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
											</svg>
										</div>
									{/if}
								</div>
								<div class="flex-1">
									<h3 class="font-semibold text-gray-900 text-xl mb-1">{offer.guide.name}</h3>
									<div class="flex items-center gap-2">
										<div class="flex items-center gap-1">
											<span class="text-yellow-400">★</span>
											<span class="text-sm font-medium text-gray-700">
												{offer.guideProfile?.avgRating?.toFixed(1) || '0.0'}
											</span>
										</div>
										<span class="text-sm text-gray-500">0건 여행 진행</span>
									</div>
								</div>
								<button class="px-6 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors">
									팔로우
								</button>
							</div>

							<!-- Guide Info Section -->
							{#if offer.guideProfile?.introduction}
								<div class="px-5 pb-6">
									<button 
										class="w-full flex items-center justify-between"
										onclick={() => {/* Toggle guide info */}}
									>
										<h4 class="font-semibold text-gray-900">가이드 정보</h4>
										<div class="w-5 h-5 flex-shrink-0">
											<svg class="w-full h-full text-gray-400 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
											</svg>
										</div>
									</button>
									<div class="mt-4 text-sm text-gray-600 leading-relaxed">
										{offer.guideProfile.introduction}
									</div>
								</div>
							{:else}
								<div class="px-5 pb-6">
									<p class="text-sm text-gray-500 text-center">가이드 소개가 아직 작성되지 않았습니다.</p>
								</div>
							{/if}

							<!-- Photos Section -->
							<div class="flex-1 flex items-center justify-center bg-gray-50 mx-5 mb-6 rounded-lg">
								<div class="text-center">
									<svg class="w-16 h-16 text-gray-300 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
										<path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
									</svg>
									<p class="text-sm text-gray-400">사진이 없습니다</p>
								</div>
							</div>
						{:else}
							<!-- Empty State -->
							<div class="flex-1 flex items-center justify-center px-5">
								<div class="text-center">
									<svg class="w-20 h-20 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
									</svg>
									<h3 class="text-lg font-medium text-gray-900 mb-2">가이드 정보가 없습니다</h3>
									<p class="text-sm text-gray-500">아직 가이드 프로필이 등록되지 않았습니다.</p>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					{@const hasReviews = false} <!-- TODO: Replace with actual reviews check -->
					<!-- Reviews Tab -->
					<div class="flex flex-col h-full">
						{#if hasReviews}
							<!-- Guide Profile Section (same as guide tab) -->
							<div class="flex items-center gap-4 px-5 py-6">
								<div
									class="w-20 h-20 rounded-full bg-blue-100 bg-cover bg-center flex-shrink-0"
									style={offer.guideProfile?.profileImageUrl ? `background-image: url('${offer.guideProfile.profileImageUrl}')` : ''}
								>
									{#if !offer.guideProfile?.profileImageUrl}
										<div class="flex items-center justify-center w-full h-full text-white text-2xl">
											<svg class="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
												<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
											</svg>
										</div>
									{/if}
								</div>
								<div class="flex-1">
									<h3 class="font-semibold text-gray-900 text-xl mb-1">{offer.guide?.name || '알 수 없는 가이드'}</h3>
									<div class="flex items-center gap-2">
										<div class="flex items-center gap-1">
											<span class="text-yellow-400">★</span>
											<span class="text-sm font-medium text-gray-700">4.6</span>
										</div>
										<span class="text-sm text-gray-500">752건 여행 진행</span>
									</div>
								</div>
								<button class="px-6 py-2 bg-gray-600 text-white rounded-full text-sm font-medium hover:bg-gray-700 transition-colors">
									팔로잉
								</button>
							</div>

							<!-- Rating Summary -->
							<div class="px-5 pb-6">
								<h2 class="text-2xl font-bold text-blue-500 mb-2">평점은 4.6점이며</h2>
								<p class="text-lg text-gray-900">친절하다는 평가가 많아요</p>
							</div>

							<!-- Rating Stats -->
							<div class="px-5 pb-6">
								<div class="bg-gray-50 rounded-2xl p-5 relative">
									<div class="flex items-center justify-between mb-4">
										<div class="flex items-center gap-4">
											<button class="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium">
												가이드
											</button>
											<button class="px-4 py-2 bg-white text-gray-700 rounded-full text-sm font-medium">
												평균
											</button>
										</div>
									</div>
									
									<!-- Progress Bar -->
									<div class="relative h-2 bg-gray-200 rounded-full mb-4">
										<div class="absolute h-full bg-blue-500 rounded-full" style="width: 92%"></div>
									</div>
									
									<!-- Stats -->
									<div class="flex justify-between text-sm">
										<div>
											<p class="text-gray-500">현재</p>
											<p class="font-semibold text-blue-500">4.6점</p>
										</div>
										<div class="text-right">
											<p class="text-gray-500">752건의 후기</p>
										</div>
									</div>
								</div>
							</div>

							<!-- Reviews List Header -->
							<div class="px-5 pb-3 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">전체</span>
									<span class="text-sm font-bold text-blue-500">752</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-blue-500">✓</span>
									<span class="text-sm text-gray-700">사진 리뷰만</span>
									<button class="text-sm text-gray-700">최신순 ▼</button>
								</div>
							</div>

							<!-- Sample Review -->
							<div class="px-5 pb-6">
								<div class="border-t border-gray-100 pt-4">
									<div class="flex items-start gap-3 mb-3">
										<img 
											src="https://via.placeholder.com/40" 
											alt="Reviewer" 
											class="w-10 h-10 rounded-full"
										/>
										<div class="flex-1">
											<h4 class="font-semibold text-gray-900">윤재원</h4>
											<div class="flex items-center gap-2 mb-2">
												<span class="text-yellow-400">★</span>
												<span class="text-sm font-medium">4.6</span>
												<span class="text-sm text-gray-500">오늘</span>
											</div>
											<p class="text-sm text-gray-700 leading-relaxed">
												Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.
											</p>
										</div>
										<button class="text-gray-400">⋯</button>
									</div>
								</div>
							</div>
						{:else}
							<!-- Empty State for Reviews -->
							<div class="flex-1 flex flex-col">
								<!-- Guide Profile Section -->
								{#if offer.guide}
									<div class="flex items-center gap-4 px-5 py-6 border-b border-gray-100">
										<div
											class="w-16 h-16 rounded-full bg-blue-100 bg-cover bg-center flex-shrink-0"
											style={offer.guideProfile?.profileImageUrl ? `background-image: url('${offer.guideProfile.profileImageUrl}')` : ''}
										>
											{#if !offer.guideProfile?.profileImageUrl}
												<div class="flex items-center justify-center w-full h-full text-white">
													<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
														<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
													</svg>
												</div>
											{/if}
										</div>
										<div class="flex-1">
											<h3 class="font-semibold text-gray-900 text-lg">{offer.guide.name}</h3>
											<p class="text-sm text-gray-500">아직 리뷰가 없습니다</p>
										</div>
									</div>
								{/if}
								
								<!-- Empty Reviews Message -->
								<div class="flex-1 flex items-center justify-center px-5">
									<div class="text-center">
										<svg class="w-20 h-20 text-gray-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
										</svg>
										<h3 class="text-lg font-medium text-gray-900 mb-2">아직 리뷰가 없습니다</h3>
										<p class="text-sm text-gray-500 mb-6">이 가이드와 함께한 여행 후<br/>첫 번째 리뷰를 작성해보세요!</p>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Bottom Actions -->
			<div class="sticky bottom-0 bg-white border-t border-gray-200 p-4">
				{#if activeTab === 'guide'}
					<!-- Chat button for guide tab -->
					<button
						onclick={() => onStartChat(offer.id)}
						class="w-full py-4 bg-[#1095f4] text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
					>
						<img src={chatIconUrl} alt="chat" class="w-5 h-5 flex-shrink-0 brightness-0 invert" />
						<span class="text-base">대화하기</span>
					</button>
				{:else if activeTab === 'offer'}
					<!-- Payment section for offer tab -->
					{#if offer.status === 'pending'}
						<div class="flex items-center gap-4">
							<div class="w-1/3">
								<p class="text-xs text-gray-500 mb-1">총 금액</p>
								<p class="text-xl font-bold text-gray-900">{offer.price.toLocaleString()}원</p>
							</div>
							<button
								onclick={() => onAccept(offer.id)}
								class="w-2/3 py-4 bg-[#1095f4] text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
							>
								<img src={moneyOutIconUrl} alt="payment" class="w-5 h-5 brightness-0 invert" />
								<span>결제하기</span>
							</button>
						</div>
					{:else if offer.status === 'accepted'}
						<button
							onclick={() => onStartChat(offer.id)}
							class="w-full py-4 bg-[#1095f4] text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
						>
							<img src={chatIconUrl} alt="chat" class="w-5 h-5 flex-shrink-0 brightness-0 invert" />
							<span class="text-base">대화하기</span>
						</button>
					{:else}
						<div class="text-center py-3 px-6 bg-gray-100 rounded-lg">
							<span class="text-gray-600">
								{offer.status === 'rejected' ? '거절된 제안입니다' : '처리된 제안입니다'}
							</span>
						</div>
					{/if}
				{:else if activeTab === 'review'}
					<!-- Write review button for review tab -->
					<button class="w-full py-4 bg-[#1095f4] text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
						<img src={pencilIconUrl} alt="write review" class="w-5 h-5 brightness-0 invert" />
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
	
	/* Ensure SVGs don't overflow their containers */
	:global(.w-5.h-5 svg) {
		max-width: 100%;
		max-height: 100%;
		width: 100%;
		height: 100%;
	}
</style>
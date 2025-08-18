<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';
	import { Star } from 'lucide-svelte';
	import UserTwoIcon from '$lib/icons/icon-user-two-mono.svg';
	import CalendarCheckIcon from '$lib/icons/icon-calendar-check-mono.svg';

	let { data } = $props();
	let orders = $derived(data.orders);
	let activeTab = $state('all'); // 'all', 'active', 'completed'
	let sortOrder = $state<'newest' | 'oldest'>('newest'); // 'newest' or 'oldest'

	// Filter and sort orders
	let filteredOrders = $derived(() => {
		let filtered = orders;
		
		if (activeTab === 'active') {
			// All completed payments (trips not yet ended + all product payments)
			filtered = orders.filter(order => 
				order.payment.status === 'completed' && (
					order.type === 'product' || 
					(order.type === 'trip' && 'endDate' in order && new Date(order.endDate) > new Date())
				)
			);
		} else if (activeTab === 'completed') {
			// Only trips that have ended
			filtered = orders.filter(order => 
				order.payment.status === 'completed' && 
				order.type === 'trip' &&
				'endDate' in order &&
				new Date(order.endDate) <= new Date()
			);
		}
		
		// Sort by payment date
		const sorted = [...filtered].sort((a, b) => {
			const dateA = new Date(a.payment.createdAt).getTime();
			const dateB = new Date(b.payment.createdAt).getTime();
			return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
		});
		
		return sorted;
	});

	// Count for each tab
	let allCount = $derived(orders.length);
	let activeCount = $derived(
		orders.filter(order => 
			order.payment.status === 'completed' && (
				order.type === 'product' || 
				(order.type === 'trip' && 'endDate' in order && new Date(order.endDate) > new Date())
			)
		).length
	);
	let completedCount = $derived(
		orders.filter(order => 
			order.payment.status === 'completed' && 
			order.type === 'trip' &&
			'endDate' in order &&
			new Date(order.endDate) <= new Date()
		).length
	);

	function isTripCompleted(order: any) {
		return order.type === 'trip' && 
			order.payment.status === 'completed' && 
			'endDate' in order &&
			new Date(order.endDate) <= new Date();
	}

	function formatBudget(min: number | null, max: number | null) {
		if (!min && !max) return '예산 미정';
		if (!max) return `₩${min?.toLocaleString()} 이상`;
		return `₩${min?.toLocaleString()} - ₩${max?.toLocaleString()}`;
	}

	function formatTravelMethod(method: string | null) {
		if (!method) return '미정';

		const methodMap: Record<string, string> = {
			walking: '도보',
			driving: '자동차',
			public_transport: '대중교통',
			bike: '자전거',
			other: '기타'
		};

		// Handle combined methods
		if (method.includes('+')) {
			const methods = method.split('+');
			return methods.map(m => methodMap[m] || m).join('/');
		}

		return methodMap[method] || method;
	}

	function formatOrderDate(date: Date | string) {
		return formatDate(date, {
			locale: $userLocale,
			timezone: $userTimezone,
			format: 'long'
		});
	}

	function getPaymentStatusText(status: string) {
		const statusMap: Record<string, string> = {
			completed: '결제 완료',
			cancelled: '결제 취소',
			pending: '결제 대기',
			failed: '결제 실패'
		};
		return statusMap[status] || status;
	}

	function getPaymentStatusColor(status: string) {
		const colorMap: Record<string, string> = {
			completed: 'bg-emerald-600 text-white',
			cancelled: 'bg-red-100 text-red-800',
			pending: 'bg-yellow-100 text-yellow-800',
			failed: 'bg-red-100 text-red-800'
		};
		return colorMap[status] || 'bg-gray-100 text-gray-800';
	}

	async function goToReview(tripId: string, event: Event) {
		event.stopPropagation();
		
		// First, check if a review token exists for this trip
		try {
			const response = await fetch(`/api/trips/${tripId}/review-token`);
			if (response.ok) {
				const data = await response.json();
				if (data.reviewToken) {
					goto(`/write-review/${data.reviewToken}`);
				} else {
					// Generate review token if it doesn't exist
					const generateResponse = await fetch(`/api/trips/${tripId}/review-token/generate`, {
						method: 'POST'
					});
					
					if (generateResponse.ok) {
						const generateData = await generateResponse.json();
						if (generateData.reviewToken) {
							goto(`/write-review/${generateData.reviewToken}`);
						} else {
							alert('리뷰 작성 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
						}
					} else {
						alert('리뷰 작성 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
					}
				}
			} else {
				alert('리뷰 정보를 불러올 수 없습니다.');
			}
		} catch (error) {
			console.error('Error fetching review token:', error);
			alert('리뷰 페이지로 이동할 수 없습니다.');
		}
	}
	
	async function goToProductReview(productId: string, event: Event) {
		event.stopPropagation();
		
		// First, check if a review token exists for this product
		try {
			const response = await fetch(`/api/products/${productId}/review-token`);
			if (response.ok) {
				const data = await response.json();
				if (data.reviewToken) {
					goto(`/write-review/${data.reviewToken}`);
				} else {
					// Generate review token if it doesn't exist
					const generateResponse = await fetch(`/api/products/${productId}/review-token/generate`, {
						method: 'POST'
					});
					
					if (generateResponse.ok) {
						const generateData = await generateResponse.json();
						if (generateData.reviewToken) {
							goto(`/write-review/${generateData.reviewToken}`);
						} else {
							alert('리뷰 작성 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
						}
					} else {
						alert('리뷰 작성 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
					}
				}
			} else {
				alert('리뷰 정보를 불러올 수 없습니다.');
			}
		} catch (error) {
			console.error('Error fetching product review token:', error);
			alert('리뷰 페이지로 이동할 수 없습니다.');
		}
	}
</script>

<svelte:head>
	<title>주문 내역 - MatchTrip</title>
</svelte:head>

<div class="max-w-md bg-gray-50 min-h-screen">
	<!-- Header with Tabs -->
	<div class="bg-white px-2 pt-4 pb-2">
		<!-- Tabs -->
		<div class="flex border-b border-gray-200">
			<button 
				onclick={() => activeTab = 'all'}
				class="flex-1 pb-3 px-1 relative {activeTab === 'all' ? 'text-gray-900 font-semibold' : 'text-gray-500'}"
			>
				<span class="flex items-center justify-center gap-2">
					전체 
					<span class="bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs font-medium">
						{allCount}
					</span>
				</span>
				{#if activeTab === 'all'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
				{/if}
			</button>
			
			<button 
				onclick={() => activeTab = 'active'}
				class="flex-1 pb-3 px-1 relative {activeTab === 'active' ? 'text-gray-900 font-semibold' : 'text-gray-500'}"
			>
				<span class="flex items-center justify-center gap-2">
					결제 완료
					<span class="bg-gray-300 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
						{activeCount}
					</span>
				</span>
				{#if activeTab === 'active'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
				{/if}
			</button>
			
			<button 
				onclick={() => activeTab = 'completed'}
				class="flex-1 pb-3 px-1 relative {activeTab === 'completed' ? 'text-gray-900 font-semibold' : 'text-gray-500'}"
			>
				<span class="flex items-center justify-center gap-2">
					여행 완료
					<span class="bg-gray-300 text-gray-700 rounded-full px-2 py-0.5 text-xs font-medium">
						{completedCount}
					</span>
				</span>
				{#if activeTab === 'completed'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
				{/if}
			</button>
		</div>
	</div>
	
	<!-- Filter and Sort -->
	<div class="px-2 py-3 bg-white border-b border-gray-200">
		<div class="flex items-center justify-between">
			<span class="text-sm text-gray-700">
				전체 <span class="text-blue-500 font-medium">{filteredOrders().length}</span>
			</span>
			<button 
				onclick={() => sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest'}
				class="flex items-center gap-1 text-sm text-gray-700"
			>
				{sortOrder === 'newest' ? '최신순' : '과거순'}
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					{#if sortOrder === 'newest'}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<div class="px-2 py-4">
		{#if filteredOrders().length === 0}
		<!-- Empty State -->
		<div class="rounded-lg border border-gray-200 bg-white p-8 text-center">
			<div class="mb-4 text-6xl">🛒</div>
			<h3 class="mb-2 text-lg font-medium text-gray-900">아직 주문 내역이 없습니다</h3>
			<p class="mb-6 text-gray-600">여행 제안을 수락하고 결제를 완료하면 여기에 표시됩니다</p>
			<button
				onclick={() => goto('/trips')}
				class="rounded-lg bg-pink-500 px-6 py-2 text-white hover:bg-pink-600"
			>
				여행 둘러보기
			</button>
		</div>
	{:else}
		<!-- Order List -->
		<div class="space-y-3">
			{#each filteredOrders() as order}
				<div
					class="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md {order
						.payment.status === 'cancelled'
						? 'opacity-75'
						: ''}"
					onclick={() => goto(`/order-history/details?id=${order.payment.id}`)}
				>
					<!-- Status Badge -->
					<div class="mb-3">
						<span
							class="inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold {isTripCompleted(order) ? 'bg-gray-100 text-gray-700' : getPaymentStatusColor(
								order.payment.status
							)}"
						>
							{isTripCompleted(order) ? '여행 완료' : getPaymentStatusText(order.payment.status)}
						</span>
					</div>
					
					<!-- Trip Info -->
					<div class="mb-3">
						<h3 class="font-bold text-lg text-gray-900 mb-2">
							{#if order.type === 'trip'}
								{'destination' in order ? (order.destination?.city || '알 수 없는 도시') + ', ' + (order.destination?.country || '') : '알 수 없는 도시'}
							{:else}
								{'productTitle' in order ? order.productTitle : '알 수 없는 상품'}
							{/if}
						</h3>
						
						<div class="flex items-center gap-1 mb-1 text-gray-600">
							<img src={CalendarCheckIcon} alt="Calendar" class="h-4 w-4" style="filter: brightness(0) saturate(100%) invert(40%) sepia(7%) saturate(497%) hue-rotate(175deg) brightness(92%) contrast(87%);" />
							<span class="text-sm">
								{#if order.type === 'trip' && 'startDate' in order && 'endDate' in order}
									{formatDateRange(order.startDate, order.endDate, {
										locale: $userLocale,
										timezone: $userTimezone,
										format: 'short'
									})}
									<span class="text-blue-500 ml-1">
										{Math.ceil((new Date(order.endDate) - new Date(order.startDate)) / (1000 * 60 * 60 * 24))}박 {Math.ceil((new Date(order.endDate) - new Date(order.startDate)) / (1000 * 60 * 60 * 24)) + 1}일
									</span>
								{:else if 'productDuration' in order}
									{order.productDuration ? `${order.productDuration}일 일정` : '일정 미정'}
								{:else}
									일정 미정
								{/if}
							</span>
						</div>
						
						<div class="flex items-center gap-1 mb-2 text-gray-600">
							<img src={UserTwoIcon} alt="People" class="h-4 w-4" style="filter: brightness(0) saturate(100%) invert(40%) sepia(7%) saturate(497%) hue-rotate(175deg) brightness(92%) contrast(87%);" />
							<span class="text-sm">
								{#if order.type === 'trip' && 'adultsCount' in order}
									성인 {order.adultsCount || 0}명{'childrenCount' in order && order.childrenCount > 0 ? ` • 아동 ${order.childrenCount}명` : ''}
								{:else}
									1명
								{/if}
							</span>
						</div>
						
						<!-- Additional Info with gray background -->
						{#if order.type === 'trip' && 'travelMethod' in order && order.travelMethod}
							<div class="flex flex-wrap gap-2 mb-2">
								<span class="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs text-gray-700">
									{formatTravelMethod(order.travelMethod)}
								</span>
							</div>
						{/if}
					</div>
					
					<!-- Price and Actions -->
					<div class="flex items-center justify-between border-t border-gray-100 pt-3">
						<div>
							<p class="text-xs text-gray-500 mb-1">
								{formatOrderDate(order.payment.createdAt)}
							</p>
							<p class="text-lg font-bold text-gray-900">
								{order.payment.amount.toLocaleString()}원
							</p>
						</div>
						
						<div></div>
					</div>
					
					{#if isTripCompleted(order) && order.type === 'trip' && 'id' in order}
						<button
							onclick={(e) => goToReview(order.id, e)}
							class="w-full flex items-center justify-center gap-1 rounded-lg bg-blue-500 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-600 mt-3"
						>
							<Star class="h-4 w-4" fill="white" />
							리뷰 작성
						</button>
					{:else if order.type === 'product' && order.payment.status === 'completed' && 'id' in order}
						<!-- Product reviews enabled -->
						<button
							onclick={(e) => goToProductReview(order.id, e)}
							class="w-full flex items-center justify-center gap-1 rounded-lg bg-blue-500 px-4 py-2.5 text-white text-sm font-medium hover:bg-blue-600 mt-3"
						>
							<Star class="h-4 w-4" fill="white" />
							리뷰 작성
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	</div>
</div>

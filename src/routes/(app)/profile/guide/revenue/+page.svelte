<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
	import ArrowRightIcon from '$lib/icons/icon-arrow-right-small-mono-1.svg';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	const { data } = $props();
	const payments = $derived(data.payments || []);
	const monthlyPayments = $derived(data.monthlyPayments || []);
	const totalRevenue = $derived(data.totalRevenue || 0);
	const settlements = $derived(data.settlements || []);
	const monthlySettlements = $derived(data.monthlySettlements || []);
	const totalPendingSettlement = $derived(data.totalPendingSettlement || 0);
	const totalCompletedSettlement = $derived(data.totalCompletedSettlement || 0);
	
	// Get current URL params
	const searchParams = $derived($page.url.searchParams);

	// Make filter states reactive to URL changes
	let activeTab = $derived(searchParams.get('tab') || 'sales');
	let filterType = $derived(searchParams.get('paymentStatus') || 'all'); // all, completed, cancelled
	let salesStartDate = $derived(searchParams.get('startDate') || '');
	let salesEndDate = $derived(searchParams.get('endDate') || '');
	// Default to 3months if no date params in URL
	let salesPeriodTab = $state(!searchParams.get('startDate') && !searchParams.get('endDate') ? '3months' : ''); // 1day, 1week, 1month, 3months
	let showSalesStatusModal = $state(false);
	let showSalesDateModal = $state(false);
	let tempSalesStatus = $state(''); // Temporary selection in modal
	let tempSalesStartDate = $state('');
	let tempSalesEndDate = $state('');
	let isSalesDateApplying = $state(false); // Loading state for date apply
	let isSalesStatusApplying = $state(false); // Loading state for status apply
	
	// Settlement tab filters
	let settlementStatusFilter = $derived(searchParams.get('settlementStatus') || 'all'); // all, pending, completed
	let settlementStartDate = $derived(searchParams.get('startDate') || '');
	let settlementEndDate = $derived(searchParams.get('endDate') || '');
	// Default to 3months if no date params in URL
	let settlementPeriodTab = $state(!searchParams.get('startDate') && !searchParams.get('endDate') ? '3months' : ''); // '', 1day, 1week, 1month, 3months
	let showStatusModal = $state(false);
	let showDateModal = $state(false);
	let tempSettlementStatus = $state(''); // Temporary selection in modal
	let tempStartDate = $state('');
	let tempEndDate = $state('');
	let isSettlementDateApplying = $state(false); // Loading state for date apply
	let isSettlementStatusApplying = $state(false); // Loading state for status apply

	// Navigation functions
	async function updateFilters(newParams: Record<string, string>) {
		const url = new URL($page.url);
		
		// Update URL params
		for (const [key, value] of Object.entries(newParams)) {
			if (value) {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		
		// Navigate to new URL
		await goto(url.toString(), { replaceState: true, noScroll: true });
	}
	
	async function setSalesPeriod(period: string) {
		salesPeriodTab = period;
		const today = new Date();
		let startDate = new Date(today);
		let endDate = new Date(today);
		
		switch (period) {
			case '1day':
				// Today only
				break;
			case '1week':
				startDate.setDate(today.getDate() - 7);
				break;
			case '1month':
				startDate.setMonth(today.getMonth() - 1);
				break;
			case '3months':
				startDate.setMonth(today.getMonth() - 3);
				break;
		}
		
		await updateFilters({
			startDate: startDate.toISOString().split('T')[0],
			endDate: endDate.toISOString().split('T')[0]
		});
	}

	// Use server-side filtered data directly
	const filteredPayments = $derived(payments);

	// Use server-side filtered data directly
	const filteredMonthlyPayments = $derived(monthlyPayments);

	// Use server-side calculated total
	const filteredTotalRevenue = $derived(totalRevenue);

	function formatPrice(amount: number) {
		return new Intl.NumberFormat('ko-KR').format(amount);
	}

	function formatDate(date: string | Date) {
		const d = new Date(date);
		return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
	}

	function formatTime(date: string | Date) {
		const d = new Date(date);
		return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
	}

	function formatDateForDisplay(date: string) {
		if (!date) return '';
		const d = new Date(date);
		return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
	}

	function getMonthName(year: number, month: number) {
		return `${year}년 ${month}월`;
	}

	function getPaymentStatusText(status: string) {
		switch (status) {
			case 'completed':
				return '결제 완료';
			case 'cancelled':
				return '결제 취소';
			case 'refunded':
				return '환불';
			default:
				return status;
		}
	}

	function getPaymentStatusColor(status: string) {
		switch (status) {
			case 'completed':
				return 'text-green-600';
			case 'cancelled':
			case 'refunded':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	// Use server-side filtered data directly
	const filteredSettlements = $derived(settlements);

	// Use server-side filtered data directly
	const filteredMonthlySettlements = $derived(monthlySettlements);

	// Use server-side calculated totals
	const filteredTotalSettlement = $derived(totalPendingSettlement);

	async function setQuickDateRange(period: string) {
		const today = new Date();
		const endDate = new Date(today);
		let startDate = new Date(today);

		settlementPeriodTab = period;

		switch (period) {
			case '1day':
				// Today only
				break;
			case '1week':
				startDate.setDate(today.getDate() - 7);
				break;
			case '1month':
				startDate.setMonth(today.getMonth() - 1);
				break;
			case '3months':
				startDate.setMonth(today.getMonth() - 3);
				break;
			default:
				// Clear dates for 'all'
				await updateFilters({ startDate: '', endDate: '' });
				return;
		}

		const newStartDate = startDate.toISOString().split('T')[0];
		const newEndDate = endDate.toISOString().split('T')[0];
		
		await updateFilters({ 
			startDate: newStartDate, 
			endDate: newEndDate 
		});
	}

	function getSettlementStatusText(status: string) {
		switch (status) {
			case 'pending':
				return '진행 예정';
			case 'completed':
				return '정산 완료';
			default:
				return status;
		}
	}

	function getSettlementStatusColor(status: string) {
		switch (status) {
			case 'pending':
				return 'bg-green-500 text-white';
			case 'completed':
				return 'bg-gray-500 text-white';
			default:
				return 'bg-gray-400 text-white';
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-md">
		<!-- Header -->
		<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
			<div class="flex h-14 items-center px-4">
				<button onclick={() => window.history.back()} class="-ml-2 p-2">
					<ChevronLeft class="h-5 w-5" />
				</button>
				<h1 class="ml-2 text-lg font-semibold">매출/정산 내역</h1>
			</div>

			<!-- Tabs -->
			<div class="flex border-b border-gray-200">
				<button
					onclick={() => {
						// Reset period tabs
						salesPeriodTab = '3months';
						settlementPeriodTab = '3months';
						// Update URL with reset filters
						updateFilters({ 
							tab: 'sales',
							// Reset all filters when switching tabs
							paymentStatus: '',
							settlementStatus: '',
							startDate: '',
							endDate: ''
						});
					}}
					class="relative flex-1 py-3 text-center font-medium transition-colors {activeTab ===
					'sales'
						? 'text-gray-900'
						: 'text-gray-500'}"
				>
					매출 내역
					{#if activeTab === 'sales'}
						<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900"></div>
					{/if}
				</button>
				<button
					onclick={() => {
						// Reset period tabs
						salesPeriodTab = '3months';
						settlementPeriodTab = '3months';
						// Update URL with reset filters
						updateFilters({ 
							tab: 'settlement',
							// Reset all filters when switching tabs
							paymentStatus: '',
							settlementStatus: '',
							startDate: '',
							endDate: ''
						});
					}}
					class="relative flex-1 py-3 text-center font-medium transition-colors {activeTab ===
					'settlement'
						? 'text-gray-900'
						: 'text-gray-500'}"
				>
					정산 내역
					{#if activeTab === 'settlement'}
						<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-900"></div>
					{/if}
				</button>
			</div>
		</header>

		{#if activeTab === 'sales'}
			<!-- Filters -->
			<div class="border-b border-gray-200 bg-white px-4 py-3">
				<div class="flex items-center gap-2">
					<!-- Status Filter -->
					<button
						onclick={() => {
							tempSalesStatus = filterType; // Initialize with current value
							showSalesStatusModal = true;
						}}
						class="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm"
					>
						<span class="text-gray-500 text-xs">종류</span>
						<span class="font-medium text-xs">
							{filterType === 'all'
								? '전체'
								: filterType === 'completed'
									? '결제 완료'
									: '취소/환불'}
						</span>
						<img src={ArrowRightIcon} alt="" class="h-4 w-4" />
					</button>
					
					<!-- Date Filter -->
					<button
						onclick={() => {
							// If using default 3-month range, calculate dates for the modal
							if (!searchParams.get('startDate') && !searchParams.get('endDate')) {
								const today = new Date();
								const threeMonthsAgo = new Date(today);
								threeMonthsAgo.setMonth(today.getMonth() - 3);
								tempSalesStartDate = threeMonthsAgo.toISOString().split('T')[0];
								tempSalesEndDate = today.toISOString().split('T')[0];
							} else {
								tempSalesStartDate = salesStartDate || '';
								tempSalesEndDate = salesEndDate || '';
							}
							showSalesDateModal = true;
						}}
						class="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm"
					>
						<span class="text-gray-500 text-xs">기간</span>
						<span class="font-medium text-xs">
							{(() => {
								// Show default 3-month range when no explicit dates are set
								if (!searchParams.get('startDate') && !searchParams.get('endDate')) {
									const today = new Date();
									const threeMonthsAgo = new Date(today);
									threeMonthsAgo.setMonth(today.getMonth() - 3);
									return `${formatDateForDisplay(threeMonthsAgo.toISOString().split('T')[0])}~${formatDateForDisplay(today.toISOString().split('T')[0])}`;
								} else if (salesStartDate && salesEndDate) {
									return `${formatDateForDisplay(salesStartDate)}~${formatDateForDisplay(salesEndDate)}`;
								}
								return '전체 기간';
							})()}
						</span>
						<img src={ArrowRightIcon} alt="" class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Revenue Summary -->
			<div class="border-b border-gray-200 bg-white px-4 py-4">
				<div>
					<div class="mb-1 text-base font-semibold">매출 내역</div>
					<div class="mb-3 text-xs text-gray-400">
						기간별로 집계된 매출 내역을 확인할 수 있습니다.
					</div>
					
					<!-- Period Tab Selection -->
					<div class="mb-4 flex gap-2">
						<button
							onclick={() => setSalesPeriod('1day')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {salesPeriodTab === '1day'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							1일
						</button>
						<button
							onclick={() => setSalesPeriod('1week')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {salesPeriodTab === '1week'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							1주
						</button>
						<button
							onclick={() => setSalesPeriod('1month')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {salesPeriodTab === '1month'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							1달
						</button>
						<button
							onclick={() => setSalesPeriod('3months')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {salesPeriodTab === '3months'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							3달
						</button>
					</div>
					
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">예상 수익금</span>
						<span class="text-xl font-bold">{formatPrice(filteredTotalRevenue)}원</span>
					</div>
				</div>
			</div>

			<!-- Monthly Payments -->
			<div class="space-y-6 p-4">
				{#if filteredMonthlyPayments.length === 0}
					<div class="rounded-lg bg-white p-8 text-center">
						<p class="text-gray-500">매출 내역이 없습니다.</p>
					</div>
				{:else}
					{#each filteredMonthlyPayments as monthData}
						<div>
							<!-- Month Header -->
							<div class="mb-3">
								<h3 class="text-base font-semibold text-blue-600">
									{getMonthName(monthData.year, monthData.month)}
								</h3>
							</div>

							<!-- Payment Items -->
							<div class="overflow-hidden rounded-lg bg-white">
								{#each monthData.payments as payment, index}
									<div class="p-4 {index > 0 ? 'border-t border-gray-100' : ''}">
										<div class="mb-2 flex items-start justify-between">
											<div>
												<div class="mb-1 text-xs text-gray-500">
													{formatDate(payment.createdAt)}
												</div>
												<div class="text-lg font-semibold">
													{formatPrice(payment.amount)}원
												</div>
											</div>
											<div class={`text-xs font-medium ${getPaymentStatusColor(payment.status)}`}>
												{getPaymentStatusText(payment.status)}
											</div>
										</div>
										<div class="space-y-0.5 text-xs text-gray-400">
											<div>
												#{payment.orderId || 'N/A'} · {payment.type === 'product' ? '상품' : '여행'}
												구매 : {payment.productTitle || payment.offerTitle || 'N/A'}
											</div>
											<div>
												{formatDate(payment.createdAt)}
												{formatTime(payment.createdAt)} 결제
											</div>
										</div>
									</div>
								{/each}

								<!-- Month Total -->
								<div class="border-t border-gray-200 bg-gray-50 px-4 py-3">
									<div class="flex items-center justify-between">
										<span class="text-sm font-medium text-gray-600">월 합계</span>
										<span class="text-base font-bold">{formatPrice(monthData.totalAmount)}원</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Sales Status Filter Modal -->
			{#if showSalesStatusModal}
				<div class="fixed inset-0 z-40 bg-black/50" onclick={() => (showSalesStatusModal = false)}></div>
				<div class="fixed bottom-0 left-0 right-0 z-50">
					<div class="mx-auto max-w-md rounded-t-2xl bg-white p-6">
						<div class="mb-6 flex items-center justify-between">
							<h3 class="text-lg font-semibold">종류</h3>
							<button onclick={() => (showSalesStatusModal = false)} class="rounded-full p-1 hover:bg-gray-100">
								<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div class="space-y-1">
							<button
								onclick={() => {
									tempSalesStatus = 'all';
								}}
								class="flex w-full items-center justify-between rounded-lg p-4 hover:bg-gray-50"
							>
								<span class="text-base">전체</span>
								{#if tempSalesStatus === 'all'}
									<svg class="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									<div class="h-6 w-6"></div>
								{/if}
							</button>
							<button
								onclick={() => {
									tempSalesStatus = 'completed';
								}}
								class="flex w-full items-center justify-between rounded-lg p-4 hover:bg-gray-50"
							>
								<span class="text-base">결제 완료</span>
								{#if tempSalesStatus === 'completed'}
									<svg class="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									<div class="h-6 w-6"></div>
								{/if}
							</button>
							<button
								onclick={() => {
									tempSalesStatus = 'cancelled';
								}}
								class="flex w-full items-center justify-between rounded-lg p-4 hover:bg-gray-50"
							>
								<span class="text-base">취소/환불</span>
								{#if tempSalesStatus === 'cancelled'}
									<svg class="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									<div class="h-6 w-6"></div>
								{/if}
							</button>
						</div>
						<button
							onclick={async () => {
								isSalesStatusApplying = true;
								await updateFilters({ paymentStatus: tempSalesStatus });
								isSalesStatusApplying = false;
								showSalesStatusModal = false;
							}}
							disabled={isSalesStatusApplying}
							class="mt-6 w-full rounded-lg py-3.5 text-base font-medium text-white {isSalesStatusApplying 
								? 'bg-gray-400 cursor-not-allowed' 
								: 'bg-blue-600 hover:bg-blue-700'}"
						>
							{isSalesStatusApplying ? '적용 중...' : '선택'}
						</button>
					</div>
				</div>
			{/if}

			<!-- Sales Date Modal -->
			{#if showSalesDateModal}
				<!-- Backdrop -->
				<div class="fixed inset-0 z-40 bg-black/50" onclick={() => (showSalesDateModal = false)}></div>

				<!-- Modal Content -->
				<div class="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md">
					<div class="rounded-t-2xl bg-white p-6">
						<div class="mb-6 flex items-center justify-between">
							<h3 class="text-lg font-semibold">기간 선택</h3>
							<button onclick={() => (showSalesDateModal = false)} class="rounded-full p-1 hover:bg-gray-100">
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>

						<div class="space-y-4">
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700">시작일</label>
								<input
									type="date"
									bind:value={tempSalesStartDate}
									class="w-full rounded-lg border border-gray-300 px-4 py-3"
								/>
							</div>
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700">종료일</label>
								<input
									type="date"
									bind:value={tempSalesEndDate}
									class="w-full rounded-lg border border-gray-300 px-4 py-3"
								/>
							</div>
						</div>

						<button
							onclick={async () => {
								isSalesDateApplying = true;
								await updateFilters({ 
									startDate: tempSalesStartDate, 
									endDate: tempSalesEndDate 
								});
								salesPeriodTab = ''; // Clear period tab selection when manual date is set
								isSalesDateApplying = false;
								showSalesDateModal = false;
							}}
							disabled={isSalesDateApplying}
							class="mt-4 w-full rounded-lg py-3 font-medium text-white {isSalesDateApplying 
								? 'bg-gray-400 cursor-not-allowed' 
								: 'bg-blue-600 hover:bg-blue-700'}"
						>
							{isSalesDateApplying ? '적용 중...' : '적용'}
						</button>
					</div>
				</div>
			{/if}
		{:else if activeTab === 'settlement'}
			<!-- Settlement Tab -->
			<!-- Filters -->
			<div class="border-b border-gray-200 bg-white px-4 py-3">
				<div class="flex items-center gap-2">
					<!-- Status Filter -->
					<button
						onclick={() => {
							tempSettlementStatus = settlementStatusFilter; // Initialize with current value
							showStatusModal = true;
						}}
						class="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm"
					>
						<span class="text-gray-500 text-xs">종류</span>
						<span class="font-medium text-xs">
							{settlementStatusFilter === 'all'
								? '전체 예정'
								: settlementStatusFilter === 'pending'
									? '진행 예정'
									: '정산 완료'}
						</span>
						<img src={ArrowRightIcon} alt="" class="h-4 w-4" />
					</button>

					<!-- Date Range -->
					<button
						onclick={() => {
							// If using default 3-month range, calculate dates for the modal
							if (!searchParams.get('startDate') && !searchParams.get('endDate')) {
								const today = new Date();
								const threeMonthsAgo = new Date(today);
								threeMonthsAgo.setMonth(today.getMonth() - 3);
								tempStartDate = threeMonthsAgo.toISOString().split('T')[0];
								tempEndDate = today.toISOString().split('T')[0];
							} else {
								tempStartDate = settlementStartDate || '';
								tempEndDate = settlementEndDate || '';
							}
							showDateModal = true;
						}}
						class="flex items-center gap-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm"
					>
						<span class="text-gray-500 text-xs">기간</span>
						<span class="font-medium text-xs whitespace-nowrap">
							{(() => {
								// Show default 3-month range when no explicit dates are set
								if (!searchParams.get('startDate') && !searchParams.get('endDate')) {
									const today = new Date();
									const threeMonthsAgo = new Date(today);
									threeMonthsAgo.setMonth(today.getMonth() - 3);
									return `${formatDateForDisplay(threeMonthsAgo.toISOString().split('T')[0])}~${formatDateForDisplay(today.toISOString().split('T')[0])}`;
								} else if (settlementStartDate && settlementEndDate) {
									return `${formatDateForDisplay(settlementStartDate)}~${formatDateForDisplay(settlementEndDate)}`;
								}
								return '날짜 선택';
							})()}
						</span>
						<img src={ArrowRightIcon} alt="" class="h-4 w-4" />
					</button>
				</div>
			</div>

			<!-- Settlement Summary -->
			<div class="border-b border-gray-200 bg-white px-4 py-4">
				<div>
					<div class="mb-1 text-base font-semibold">정산 내역</div>
					<div class="mb-3 text-xs text-gray-400">
						기간별로 집계된 정산 내역을 확인할 수 있습니다.
					</div>
					
					<!-- Period Tab Selection -->
					<div class="mb-4 flex gap-2">
						<button
							onclick={() => setQuickDateRange('1day')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {settlementPeriodTab === '1day'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							1일
						</button>
						<button
							onclick={() => setQuickDateRange('1week')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {settlementPeriodTab === '1week'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							1주
						</button>
						<button
							onclick={() => setQuickDateRange('1month')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {settlementPeriodTab === '1month'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							1달
						</button>
						<button
							onclick={() => setQuickDateRange('3months')}
							class="flex-1 rounded-full py-2 text-sm font-medium transition-all {settlementPeriodTab === '3months'
								? 'bg-gray-900 text-white'
								: 'bg-gray-100 text-gray-600'}"
						>
							3달
						</button>
					</div>

					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-600">예상 정산 금액</span>
						<span class="text-xl font-bold">{formatPrice(filteredTotalSettlement)}원</span>
					</div>
				</div>
			</div>

			<!-- Monthly Settlements -->
			<div class="space-y-6 p-4">
				{#if filteredMonthlySettlements.length === 0}
					<div class="rounded-lg bg-white p-8 text-center">
						<p class="text-gray-500">정산 내역이 없습니다.</p>
					</div>
				{:else}
					{#each filteredMonthlySettlements as monthData}
						<div>
							<!-- Month Header -->
							<div class="mb-3">
								<h3 class="text-base font-semibold text-blue-600">
									{getMonthName(monthData.year, monthData.month)}
								</h3>
							</div>

							<!-- Settlement Items -->
							<div class="space-y-3">
								{#each monthData.settlements as settlement}
									<div class="rounded-lg bg-white p-4">
										<div class="flex items-center justify-between">
											<div>
												<span
													class="inline-flex rounded-full px-3 py-1.5 text-xs font-semibold {getSettlementStatusColor(
														settlement.status
													)}"
												>
													{getSettlementStatusText(settlement.status)}
												</span>
												<div class="mt-2 text-xs text-gray-400">
													{formatDate(settlement.createdAt)} {formatTime(settlement.createdAt)}
												</div>
											</div>
											<div class="text-right">
												<div class="text-xl font-bold">
													{formatPrice(settlement.settlementAmount)}원
												</div>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Status Filter Modal -->
			{#if showStatusModal}
				<div class="fixed inset-0 z-40 bg-black/50" onclick={() => (showStatusModal = false)}></div>
				<div class="fixed bottom-0 left-0 right-0 z-50">
					<div class="mx-auto max-w-md rounded-t-2xl bg-white p-6">
						<div class="mb-6 flex items-center justify-between">
							<h3 class="text-lg font-semibold">종류</h3>
							<button onclick={() => (showStatusModal = false)} class="rounded-full p-1 hover:bg-gray-100">
								<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						<div class="space-y-1">
							<button
								onclick={() => {
									tempSettlementStatus = 'all';
								}}
								class="flex w-full items-center justify-between rounded-lg p-4 hover:bg-gray-50"
							>
								<span class="text-base">전체 예정</span>
								{#if tempSettlementStatus === 'all'}
									<svg class="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									<div class="h-6 w-6"></div>
								{/if}
							</button>
							<button
								onclick={() => {
									tempSettlementStatus = 'pending';
								}}
								class="flex w-full items-center justify-between rounded-lg p-4 hover:bg-gray-50"
							>
								<span class="text-base">진행 예정</span>
								{#if tempSettlementStatus === 'pending'}
									<svg class="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									<div class="h-6 w-6"></div>
								{/if}
							</button>
							<button
								onclick={() => {
									tempSettlementStatus = 'completed';
								}}
								class="flex w-full items-center justify-between rounded-lg p-4 hover:bg-gray-50"
							>
								<span class="text-base">정산 완료</span>
								{#if tempSettlementStatus === 'completed'}
									<svg class="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{:else}
									<div class="h-6 w-6"></div>
								{/if}
							</button>
						</div>
						<button
							onclick={async () => {
								isSettlementStatusApplying = true;
								await updateFilters({ settlementStatus: tempSettlementStatus });
								isSettlementStatusApplying = false;
								showStatusModal = false;
							}}
							disabled={isSettlementStatusApplying}
							class="mt-6 w-full rounded-lg py-3.5 text-base font-medium text-white {isSettlementStatusApplying 
								? 'bg-gray-400 cursor-not-allowed' 
								: 'bg-blue-600 hover:bg-blue-700'}"
						>
							{isSettlementStatusApplying ? '적용 중...' : '선택'}
						</button>
					</div>
				</div>
			{/if}

			<!-- Date Picker Modal -->
			{#if showDateModal}
				<div class="fixed inset-0 z-40 bg-black/50" onclick={() => (showDateModal = false)}></div>
				<div class="fixed bottom-0 left-0 right-0 z-50">
					<div class="mx-auto max-w-md rounded-t-2xl bg-white p-4">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-semibold">기간 선택</h3>
							<button onclick={() => (showDateModal = false)} class="p-2">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
						
						<div class="space-y-4">
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700">시작일</label>
								<input
									type="date"
									bind:value={tempStartDate}
									class="w-full rounded-lg border border-gray-300 px-3 py-2"
								/>
							</div>
							<div>
								<label class="mb-2 block text-sm font-medium text-gray-700">종료일</label>
								<input
									type="date"
									bind:value={tempEndDate}
									min={tempStartDate}
									class="w-full rounded-lg border border-gray-300 px-3 py-2"
								/>
							</div>
						</div>

						<button
							onclick={async () => {
								isSettlementDateApplying = true;
								await updateFilters({ 
									startDate: tempStartDate, 
									endDate: tempEndDate 
								});
								settlementPeriodTab = ''; // Clear period tab selection when manual date is set
								isSettlementDateApplying = false;
								showDateModal = false;
							}}
							disabled={isSettlementDateApplying}
							class="mt-4 w-full rounded-lg py-3 font-medium text-white {isSettlementDateApplying 
								? 'bg-gray-400 cursor-not-allowed' 
								: 'bg-blue-600 hover:bg-blue-700'}"
						>
							{isSettlementDateApplying ? '적용 중...' : '적용'}
						</button>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

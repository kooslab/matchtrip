<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';

	const { data } = $props();
	const payments = $derived(data.payments || []);
	const monthlyPayments = $derived(data.monthlyPayments || []);
	const totalRevenue = $derived(data.totalRevenue || 0);

	let activeTab = $state<'sales' | 'settlement'>('sales');
	let filterType = $state('all'); // all, completed, cancelled
	let filterPeriod = $state('all'); // all, 1month, 3months, 6months

	// Filter payments based on selected filters
	const filteredPayments = $derived(() => {
		let filtered = [...payments];

		// Filter by type
		if (filterType !== 'all') {
			filtered = filtered.filter(p => {
				if (filterType === 'completed') return p.status === 'completed';
				if (filterType === 'cancelled') return p.status === 'cancelled' || p.status === 'refunded';
				return true;
			});
		}

		// Filter by period
		if (filterPeriod !== 'all') {
			const now = new Date();
			const months = filterPeriod === '1month' ? 1 : filterPeriod === '3months' ? 3 : 6;
			const cutoffDate = new Date(now.setMonth(now.getMonth() - months));
			filtered = filtered.filter(p => new Date(p.createdAt) >= cutoffDate);
		}

		return filtered;
	});

	// Recalculate monthly payments based on filters
	const filteredMonthlyPayments = $derived(() => {
		const filtered = filteredPayments();
		const grouped = filtered.reduce((acc, payment) => {
			const date = new Date(payment.createdAt || 0);
			const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
			
			if (!acc[monthKey]) {
				acc[monthKey] = {
					year: date.getFullYear(),
					month: date.getMonth() + 1,
					payments: [],
					totalAmount: 0
				};
			}
			
			acc[monthKey].payments.push(payment);
			if (payment.status === 'completed') {
				acc[monthKey].totalAmount += payment.amount || 0;
			}
			
			return acc;
		}, {} as Record<string, any>);

		return Object.values(grouped).sort((a: any, b: any) => {
			if (a.year !== b.year) return b.year - a.year;
			return b.month - a.month;
		});
	});

	// Calculate filtered total revenue
	const filteredTotalRevenue = $derived(() => {
		const filtered = filteredPayments();
		return filtered
			.filter(p => p.status === 'completed')
			.reduce((sum, p) => sum + (p.amount || 0), 0);
	});

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

	function handleSettlementTab() {
		alert('정산 내역은 준비 중입니다.');
		// Keep the tab on sales
		activeTab = 'sales';
	}
</script>

<div class="min-h-screen bg-gray-50 pb-24">
	<div class="max-w-md mx-auto">
		<!-- Header -->
		<header class="sticky top-0 z-10 bg-white border-b border-gray-200">
			<div class="flex items-center h-14 px-4">
				<button onclick={() => window.history.back()} class="-ml-2 p-2">
					<ChevronLeft class="h-5 w-5" />
				</button>
				<h1 class="ml-2 text-lg font-semibold">매출/정산 내역</h1>
			</div>
			
			<!-- Tabs -->
			<div class="flex border-b border-gray-200">
				<button
					onclick={() => activeTab = 'sales'}
					class="flex-1 py-3 text-center font-medium transition-colors relative {activeTab === 'sales' ? 'text-gray-900' : 'text-gray-500'}"
				>
					매출 내역
					{#if activeTab === 'sales'}
						<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900"></div>
					{/if}
				</button>
				<button
					onclick={handleSettlementTab}
					class="flex-1 py-3 text-center font-medium text-gray-500 transition-colors relative"
				>
					정산 내역
				</button>
			</div>
		</header>

		{#if activeTab === 'sales'}
			<!-- Filters -->
			<div class="bg-white px-4 py-3 border-b border-gray-200">
				<div class="flex gap-2 overflow-x-auto">
					<select
						bind:value={filterType}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="all">종류: 전체</option>
						<option value="completed">결제 완료</option>
						<option value="cancelled">취소/환불</option>
					</select>
					<select
						bind:value={filterPeriod}
						class="px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="all">기간: 전체</option>
						<option value="1month">1개월</option>
						<option value="3months">3개월</option>
						<option value="6months">6개월</option>
					</select>
				</div>
			</div>

			<!-- Revenue Summary -->
			<div class="bg-white px-4 py-4 border-b border-gray-200">
				<div class="text-center">
					<div class="text-sm text-gray-500 mb-1">매출 내역</div>
					<div class="text-xs text-gray-400 mb-2">
						기간별로 집계된 매출 내역을 확인할 수 있습니다.
					</div>
					<div class="flex justify-between items-center pt-3 border-t border-gray-100">
						<span class="text-sm text-gray-600">예상 수익금</span>
						<span class="text-xl font-bold">{formatPrice(filteredTotalRevenue())}원</span>
					</div>
				</div>
			</div>

			<!-- Monthly Payments -->
			<div class="p-4 space-y-6">
				{#if filteredMonthlyPayments().length === 0}
					<div class="bg-white rounded-lg p-8 text-center">
						<p class="text-gray-500">매출 내역이 없습니다.</p>
					</div>
				{:else}
					{#each filteredMonthlyPayments() as monthData}
						<div>
							<!-- Month Header -->
							<div class="mb-3">
								<h3 class="text-base font-semibold text-blue-600">
									{getMonthName(monthData.year, monthData.month)}
								</h3>
							</div>

							<!-- Payment Items -->
							<div class="bg-white rounded-lg overflow-hidden">
								{#each monthData.payments as payment, index}
									<div class="p-4 {index > 0 ? 'border-t border-gray-100' : ''}">
										<div class="flex justify-between items-start mb-2">
											<div>
												<div class="text-xs text-gray-500 mb-1">
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
										<div class="text-xs text-gray-400 space-y-0.5">
											<div>#{payment.orderId || 'N/A'} · {payment.type === 'product' ? '상품' : '여행'} 구매 : {payment.productTitle || payment.offerTitle || 'N/A'}</div>
											<div>{formatDate(payment.createdAt)} {formatTime(payment.createdAt)} 결제</div>
										</div>
									</div>
								{/each}
								
								<!-- Month Total -->
								<div class="px-4 py-3 bg-gray-50 border-t border-gray-200">
									<div class="flex justify-between items-center">
										<span class="text-sm font-medium text-gray-600">월 합계</span>
										<span class="text-base font-bold">{formatPrice(monthData.totalAmount)}원</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</div>

	<GuideBottomNav />
</div>
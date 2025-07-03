<script lang="ts">
	import type { PageData } from './$types';
	import {
		CreditCard,
		Calendar,
		Users,
		MapPin,
		DollarSign,
		Clock,
		CheckCircle,
		XCircle,
		Eye,
		Filter,
		Download,
		RefreshCw,
		TrendingUp,
		AlertCircle,
		ShieldCheck
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('all');
	let sortBy = $state('newest');
	let dateRange = $state('all');

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW'
		}).format(amount);
	}

	function getStatusBadge(status: string) {
		const badges = {
			pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: '대기중' },
			succeeded: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: '성공' },
			failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: '실패' },
			refunded: { bg: 'bg-purple-100', text: 'text-purple-800', icon: RefreshCw, label: '환불됨' }
		};
		return (
			badges[status] || {
				bg: 'bg-gray-100',
				text: 'text-gray-800',
				icon: AlertCircle,
				label: status
			}
		);
	}

	function getDateRangeFilter() {
		const now = new Date();
		switch (dateRange) {
			case 'today':
				const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				return (date: string) => new Date(date) >= today;
			case 'week':
				const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				return (date: string) => new Date(date) >= weekAgo;
			case 'month':
				const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				return (date: string) => new Date(date) >= monthAgo;
			default:
				return () => true;
		}
	}

	let filteredPayments = $derived(
		data.payments
			.filter((payment) => {
				// Status filter
				if (statusFilter !== 'all' && payment.status !== statusFilter) return false;

				// Date range filter
				const dateFilter = getDateRangeFilter();
				if (!dateFilter(payment.createdAt)) return false;

				// Search filter
				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					return (
						payment.paymentIntent?.toLowerCase().includes(query) ||
						payment.tripDestination?.toLowerCase().includes(query) ||
						payment.travelerName?.toLowerCase().includes(query) ||
						payment.travelerEmail?.toLowerCase().includes(query) ||
						payment.guideName?.toLowerCase().includes(query) ||
						payment.guideEmail?.toLowerCase().includes(query)
					);
				}
				return true;
			})
			.sort((a, b) => {
				if (sortBy === 'newest') {
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				} else if (sortBy === 'oldest') {
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				} else if (sortBy === 'amount-high') {
					return (b.amount || 0) - (a.amount || 0);
				} else if (sortBy === 'amount-low') {
					return (a.amount || 0) - (b.amount || 0);
				}
				return 0;
			})
	);

	async function handleRefund(paymentId: string) {
		if (!confirm('정말로 이 결제를 환불하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/admin/payments/${paymentId}/refund`, {
				method: 'POST'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('환불 처리 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Error refunding payment:', error);
			alert('환불 처리 중 오류가 발생했습니다.');
		}
	}

	async function exportData() {
		try {
			const response = await fetch('/api/admin/payments/export');
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error exporting data:', error);
			alert('데이터 내보내기 중 오류가 발생했습니다.');
		}
	}

	// Chart data for monthly revenue
	let chartData = $derived({
		labels: data.monthlyRevenue.map((m) => {
			const [year, month] = m.month.split('-');
			return `${month}월`;
		}),
		values: data.monthlyRevenue.map((m) => m.revenue)
	});
</script>

<div class="h-full overflow-auto p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">결제 관리</h1>
		<p class="mt-2 text-gray-600">모든 결제 내역을 관리하고 모니터링합니다</p>
	</div>

	<!-- Statistics Cards -->
	<div class="mb-8 grid gap-4 md:grid-cols-4">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">총 수익</p>
					<p class="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.totalRevenue)}</p>
					<p class="mt-1 text-xs text-gray-500">성공 {data.stats.succeeded}건</p>
				</div>
				<DollarSign class="h-10 w-10 text-green-600" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">대기중</p>
					<p class="text-2xl font-bold text-gray-900">{formatCurrency(data.stats.pendingAmount)}</p>
					<p class="mt-1 text-xs text-gray-500">{data.stats.pending}건</p>
				</div>
				<Clock class="h-10 w-10 text-yellow-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">실패</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.failed}건</p>
				</div>
				<XCircle class="h-10 w-10 text-red-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">환불</p>
					<p class="text-2xl font-bold text-gray-900">
						{formatCurrency(data.stats.refundedAmount)}
					</p>
					<p class="mt-1 text-xs text-gray-500">{data.stats.refunded}건</p>
				</div>
				<RefreshCw class="h-10 w-10 text-purple-500" />
			</div>
		</div>
	</div>

	<!-- Monthly Revenue Chart -->
	{#if data.monthlyRevenue.length > 0}
		<div class="mb-8 rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 flex items-center text-lg font-semibold text-gray-900">
				<TrendingUp class="mr-2 h-5 w-5" />
				월별 수익 추이 (최근 6개월)
			</h2>
			<div class="relative h-48">
				<div class="absolute inset-0 flex items-end justify-between gap-2">
					{#each chartData.values as value, index}
						<div class="flex flex-1 flex-col items-center">
							<div
								class="w-full rounded-t bg-blue-500"
								style="height: {(value / Math.max(...chartData.values)) * 100}%"
							></div>
							<span class="mt-2 text-xs text-gray-600">{chartData.labels[index]}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Filters and Search -->
	<div class="mb-6 rounded-lg bg-white p-4 shadow">
		<div class="flex flex-wrap items-center gap-4">
			<div class="min-w-[200px] flex-1">
				<input
					type="text"
					placeholder="결제 ID, 여행지, 여행자 또는 가이드 검색..."
					bind:value={searchQuery}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
				/>
			</div>

			<div class="flex items-center gap-2">
				<Filter class="h-5 w-5 text-gray-500" />
				<select
					bind:value={statusFilter}
					class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
				>
					<option value="all">모든 상태</option>
					<option value="pending">대기중</option>
					<option value="succeeded">성공</option>
					<option value="failed">실패</option>
					<option value="refunded">환불됨</option>
				</select>
			</div>

			<select
				bind:value={dateRange}
				class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			>
				<option value="all">전체 기간</option>
				<option value="today">오늘</option>
				<option value="week">최근 7일</option>
				<option value="month">최근 30일</option>
			</select>

			<select
				bind:value={sortBy}
				class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			>
				<option value="newest">최신순</option>
				<option value="oldest">오래된순</option>
				<option value="amount-high">금액 높은순</option>
				<option value="amount-low">금액 낮은순</option>
			</select>

			<button
				onclick={exportData}
				class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
			>
				<Download class="h-4 w-4" />
				내보내기
			</button>
		</div>
	</div>

	<!-- Payments Table -->
	<div class="overflow-hidden rounded-lg bg-white shadow">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							결제 정보
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							여행 정보
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							여행자
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							가이드
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							금액
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							상태
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							날짜
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							작업
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each filteredPayments as payment}
						{@const badge = getStatusBadge(payment.status)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<CreditCard class="mr-2 h-5 w-5 text-gray-400" />
									<div>
										<div class="text-sm font-medium text-gray-900">
											{payment.id.slice(0, 8)}...
										</div>
										{#if payment.paymentIntent}
											<div class="text-xs text-gray-500">
												PI: {payment.paymentIntent.slice(0, 12)}...
											</div>
										{/if}
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<MapPin class="mr-2 h-5 w-5 text-gray-400" />
									<div>
										<div class="text-sm text-gray-900">
											{payment.tripDestination || '미지정'}
										</div>
										{#if payment.tripStartDate}
											<div class="text-xs text-gray-500">
												{formatDate(payment.tripStartDate).split(' ')[0]}
											</div>
										{/if}
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{payment.travelerName || '이름 없음'}</div>
								<div class="text-xs text-gray-500">{payment.travelerEmail}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div>
										<div class="text-sm text-gray-900">{payment.guideName || '이름 없음'}</div>
										<div class="text-xs text-gray-500">{payment.guideEmail}</div>
									</div>
									{#if payment.guideVerified}
										<ShieldCheck class="ml-2 h-4 w-4 text-green-500" title="인증된 가이드" />
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">
									{formatCurrency(payment.amount || 0)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex items-center gap-1 rounded-full px-2 text-xs leading-5 font-semibold {badge.bg} {badge.text}"
								>
									<svelte:component this={badge.icon} class="h-3 w-3" />
									{badge.label}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">
									{formatDate(payment.createdAt).split(' ')[0]}
								</div>
								<div class="text-xs text-gray-500">
									{formatDate(payment.createdAt).split(' ')[1]}
								</div>
							</td>
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
								<div class="flex items-center gap-2">
									<a
										href="/admin/payments/{payment.id}"
										class="text-blue-600 hover:text-blue-900"
										title="상세보기"
									>
										<Eye class="h-4 w-4" />
									</a>
									{#if payment.status === 'succeeded'}
										<button
											onclick={() => handleRefund(payment.id)}
											class="text-purple-600 hover:text-purple-900"
											title="환불"
										>
											<RefreshCw class="h-4 w-4" />
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-6 py-12 text-center text-sm text-gray-500">
								{searchQuery || statusFilter !== 'all' || dateRange !== 'all'
									? '검색 결과가 없습니다.'
									: '등록된 결제가 없습니다.'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

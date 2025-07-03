<script lang="ts">
	import type { PageData } from './$types';
	import {
		FileText,
		Calendar,
		Users,
		MapPin,
		DollarSign,
		Clock,
		CheckCircle,
		XCircle,
		Eye,
		Trash2,
		Filter,
		Download,
		MessageSquare,
		ShieldCheck,
		CreditCard
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('all');
	let paymentFilter = $state('all');
	let sortBy = $state('newest');

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatCurrency(amount: number | string) {
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW'
		}).format(num);
	}

	function getStatusBadge(status: string) {
		const badges = {
			pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: '대기중' },
			accepted: { bg: 'bg-green-100', text: 'text-green-800', label: '수락됨' },
			rejected: { bg: 'bg-red-100', text: 'text-red-800', label: '거절됨' },
			cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: '취소됨' }
		};
		return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
	}

	function truncateMessage(message: string, maxLength: number = 100) {
		if (!message) return '';
		if (message.length <= maxLength) return message;
		return message.substring(0, maxLength) + '...';
	}

	let filteredOffers = $derived(
		data.offers
			.filter((offer) => {
				// Status filter
				if (statusFilter !== 'all' && offer.status !== statusFilter) return false;

				// Payment filter
				if (paymentFilter !== 'all' && offer.paymentStatus !== paymentFilter) return false;

				// Search filter
				if (searchQuery) {
					const query = searchQuery.toLowerCase();
					return (
						offer.tripDestination?.toLowerCase().includes(query) ||
						offer.travelerName?.toLowerCase().includes(query) ||
						offer.travelerEmail?.toLowerCase().includes(query) ||
						offer.guideName?.toLowerCase().includes(query) ||
						offer.guideEmail?.toLowerCase().includes(query) ||
						offer.message?.toLowerCase().includes(query)
					);
				}
				return true;
			})
			.sort((a, b) => {
				if (sortBy === 'newest') {
					return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
				} else if (sortBy === 'oldest') {
					return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
				} else if (sortBy === 'price-high') {
					return parseFloat(b.price) - parseFloat(a.price);
				} else if (sortBy === 'price-low') {
					return parseFloat(a.price) - parseFloat(b.price);
				}
				return 0;
			})
	);

	async function handleDelete(offerId: string) {
		if (!confirm('정말로 이 제안을 삭제하시겠습니까?')) return;

		try {
			const response = await fetch(`/api/admin/offers/${offerId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				window.location.reload();
			} else {
				alert('삭제 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Error deleting offer:', error);
			alert('삭제 중 오류가 발생했습니다.');
		}
	}

	async function exportData() {
		try {
			const response = await fetch('/api/admin/offers/export');
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `offers-${new Date().toISOString().split('T')[0]}.csv`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error('Error exporting data:', error);
			alert('데이터 내보내기 중 오류가 발생했습니다.');
		}
	}
</script>

<div class="h-full overflow-auto p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">제안 관리</h1>
		<p class="mt-2 text-gray-600">가이드의 여행 제안을 관리하고 모니터링합니다</p>
	</div>

	<!-- Statistics Cards -->
	<div class="mb-8 grid gap-4 md:grid-cols-7">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">전체 제안</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.total}</p>
				</div>
				<FileText class="h-10 w-10 text-blue-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">대기중</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.pending}</p>
				</div>
				<Clock class="h-10 w-10 text-yellow-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">수락됨</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.accepted}</p>
				</div>
				<CheckCircle class="h-10 w-10 text-green-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">거절됨</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.rejected}</p>
				</div>
				<XCircle class="h-10 w-10 text-red-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">취소됨</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.cancelled}</p>
				</div>
				<XCircle class="h-10 w-10 text-gray-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">결제완료</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.paid}</p>
				</div>
				<CreditCard class="h-10 w-10 text-emerald-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">총 수익</p>
					<p class="text-lg font-bold text-gray-900">{formatCurrency(data.stats.totalRevenue)}</p>
				</div>
				<DollarSign class="h-10 w-10 text-green-600" />
			</div>
		</div>
	</div>

	<!-- Filters and Search -->
	<div class="mb-6 rounded-lg bg-white p-4 shadow">
		<div class="flex flex-wrap items-center gap-4">
			<div class="min-w-[200px] flex-1">
				<input
					type="text"
					placeholder="여행지, 여행자, 가이드 또는 메시지 검색..."
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
					<option value="accepted">수락됨</option>
					<option value="rejected">거절됨</option>
					<option value="cancelled">취소됨</option>
				</select>
			</div>

			<select
				bind:value={paymentFilter}
				class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			>
				<option value="all">모든 결제상태</option>
				<option value="paid">결제완료</option>
				<option value="unpaid">미결제</option>
			</select>

			<select
				bind:value={sortBy}
				class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			>
				<option value="newest">최신순</option>
				<option value="oldest">오래된순</option>
				<option value="price-high">가격 높은순</option>
				<option value="price-low">가격 낮은순</option>
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

	<!-- Offers Table -->
	<div class="overflow-hidden rounded-lg bg-white shadow">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
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
							제안 내용
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							가격
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							상태
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							결제
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							작업
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each filteredOffers as offer}
						{@const badge = getStatusBadge(offer.status)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<MapPin class="mr-2 h-5 w-5 text-gray-400" />
									<div>
										<div class="text-sm font-medium text-gray-900">
											{offer.tripDestination || '미지정'}
										</div>
										<div class="text-xs text-gray-500">
											{#if offer.tripStartDate}
												{formatDate(offer.tripStartDate).split(' ')[0]}
											{:else}
												날짜 미정
											{/if}
										</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{offer.travelerName || '이름 없음'}</div>
								<div class="text-xs text-gray-500">{offer.travelerEmail}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<div>
										<div class="text-sm text-gray-900">{offer.guideName || '이름 없음'}</div>
										<div class="text-xs text-gray-500">{offer.guideEmail}</div>
									</div>
									{#if offer.guideVerified}
										<ShieldCheck class="ml-2 h-4 w-4 text-green-500" title="인증된 가이드" />
									{/if}
								</div>
							</td>
							<td class="px-6 py-4">
								<div class="flex items-center">
									<MessageSquare class="mr-2 h-4 w-4 flex-shrink-0 text-gray-400" />
									<div class="max-w-xs text-sm text-gray-900">
										{truncateMessage(offer.message)}
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-medium text-gray-900">
									{formatCurrency(offer.price)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {badge.bg} {badge.text}"
								>
									{badge.label}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								{#if offer.paymentStatus === 'paid'}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 text-xs leading-5 font-semibold text-emerald-800"
									>
										<CreditCard class="h-3 w-3" />
										결제완료
									</span>
								{:else if offer.status === 'accepted'}
									<span
										class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 text-xs leading-5 font-semibold text-yellow-800"
									>
										<Clock class="h-3 w-3" />
										대기중
									</span>
								{:else}
									<span class="text-xs text-gray-500">-</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
								<div class="flex items-center gap-2">
									<a
										href="/admin/offers/{offer.id}"
										class="text-blue-600 hover:text-blue-900"
										title="상세보기"
									>
										<Eye class="h-4 w-4" />
									</a>
									<button
										onclick={() => handleDelete(offer.id)}
										class="text-red-600 hover:text-red-900"
										title="삭제"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-6 py-12 text-center text-sm text-gray-500">
								{searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
									? '검색 결과가 없습니다.'
									: '등록된 제안이 없습니다.'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

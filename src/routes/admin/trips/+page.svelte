<script lang="ts">
	import type { PageData } from './$types';
	import { 
		Plane, 
		Calendar, 
		Users, 
		MapPin, 
		DollarSign,
		FileText,
		Clock,
		CheckCircle,
		XCircle,
		Eye,
		Trash2,
		Filter,
		Download
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('all');
	let sortBy = $state('newest');

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatCurrency(amount: number | string | null) {
		if (!amount) return '미정';
		const num = typeof amount === 'string' ? parseFloat(amount) : amount;
		return new Intl.NumberFormat('ko-KR', {
			style: 'currency',
			currency: 'KRW'
		}).format(num);
	}

	function getStatusBadge(status: string) {
		const badges = {
			draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: '초안' },
			submitted: { bg: 'bg-blue-100', text: 'text-blue-800', label: '제출됨' },
			accepted: { bg: 'bg-green-100', text: 'text-green-800', label: '수락됨' },
			completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: '완료됨' },
			cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: '취소됨' }
		};
		return badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
	}

	function getTourTypeLabel(type: string) {
		const types = {
			individual: '개인 여행',
			group: '그룹 여행',
			both: '둘 다 가능'
		};
		return types[type] || type;
	}

	let filteredTrips = $derived(data.trips
		.filter(trip => {
			// Status filter
			if (statusFilter !== 'all' && trip.status !== statusFilter) return false;
			
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				return (
					trip.destination?.toLowerCase().includes(query) ||
					trip.travelerName?.toLowerCase().includes(query) ||
					trip.travelerEmail?.toLowerCase().includes(query)
				);
			}
			return true;
		})
		.sort((a, b) => {
			if (sortBy === 'newest') {
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			} else if (sortBy === 'oldest') {
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			}
			return 0;
		}));

	async function handleDelete(tripId: string) {
		if (!confirm('정말로 이 여행을 삭제하시겠습니까?')) return;
		
		try {
			const response = await fetch(`/api/admin/trips/${tripId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				window.location.reload();
			} else {
				alert('삭제 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Error deleting trip:', error);
			alert('삭제 중 오류가 발생했습니다.');
		}
	}

	async function exportData() {
		try {
			const response = await fetch('/api/admin/trips/export');
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `trips-${new Date().toISOString().split('T')[0]}.csv`;
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

<div class="p-8 overflow-auto h-full">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">여행 관리</h1>
		<p class="mt-2 text-gray-600">등록된 모든 여행을 관리하고 모니터링합니다</p>
	</div>

	<!-- Statistics Cards -->
	<div class="grid gap-4 md:grid-cols-6 mb-8">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">전체 여행</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.total}</p>
				</div>
				<Plane class="h-10 w-10 text-blue-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">초안</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.draft}</p>
				</div>
				<Clock class="h-10 w-10 text-gray-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">제출됨</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.submitted}</p>
				</div>
				<FileText class="h-10 w-10 text-blue-500" />
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
					<p class="text-sm text-gray-600">완료됨</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.completed}</p>
				</div>
				<CheckCircle class="h-10 w-10 text-emerald-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">취소됨</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.cancelled}</p>
				</div>
				<XCircle class="h-10 w-10 text-red-500" />
			</div>
		</div>
	</div>

	<!-- Filters and Search -->
	<div class="mb-6 bg-white rounded-lg shadow p-4">
		<div class="flex flex-wrap gap-4 items-center">
			<div class="flex-1 min-w-[200px]">
				<input
					type="text"
					placeholder="여행지, 여행자 이름 또는 이메일 검색..."
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
					<option value="draft">초안</option>
					<option value="submitted">제출됨</option>
					<option value="accepted">수락됨</option>
					<option value="completed">완료됨</option>
					<option value="cancelled">취소됨</option>
				</select>
			</div>

			<select
				bind:value={sortBy}
				class="rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
			>
				<option value="newest">최신순</option>
				<option value="oldest">오래된순</option>
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

	<!-- Trips Table -->
	<div class="bg-white rounded-lg shadow overflow-hidden">
		<div class="overflow-x-auto">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							여행 정보
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							여행자
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							날짜
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							인원/유형
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							예산
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							제안
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							상태
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							작업
						</th>
					</tr>
				</thead>
				<tbody class="bg-white divide-y divide-gray-200">
					{#each filteredTrips as trip}
						{@const badge = getStatusBadge(trip.status)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<MapPin class="h-5 w-5 text-gray-400 mr-2" />
									<div>
										<div class="text-sm font-medium text-gray-900">
											{trip.destination || '미지정'}
										</div>
										<div class="text-xs text-gray-500">
											ID: {trip.id.slice(0, 8)}...
										</div>
									</div>
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{trip.travelerName || '이름 없음'}</div>
								<div class="text-xs text-gray-500">{trip.travelerEmail}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">
									{#if trip.startDate && trip.endDate}
										{formatDate(trip.startDate)}
									{:else}
										미정
									{/if}
								</div>
								<div class="text-xs text-gray-500">
									{#if trip.startDate && trip.endDate}
										~ {formatDate(trip.endDate)}
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center text-sm text-gray-900">
									<Users class="h-4 w-4 text-gray-400 mr-1" />
									{trip.people || 0}명
								</div>
								<div class="text-xs text-gray-500">
									{getTourTypeLabel(trip.tourType)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">
									{formatCurrency(trip.budget)}
								</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">
									{trip.offerCount || 0}개
								</div>
								{#if trip.acceptedOfferId}
									<div class="text-xs text-green-600">수락됨</div>
								{/if}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="inline-flex rounded-full px-2 text-xs font-semibold leading-5 {badge.bg} {badge.text}">
									{badge.label}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
								<div class="flex items-center gap-2">
									<a
										href="/admin/trips/{trip.id}"
										class="text-blue-600 hover:text-blue-900"
										title="상세보기"
									>
										<Eye class="h-4 w-4" />
									</a>
									<button
										onclick={() => handleDelete(trip.id)}
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
								{searchQuery || statusFilter !== 'all' ? '검색 결과가 없습니다.' : '등록된 여행이 없습니다.'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
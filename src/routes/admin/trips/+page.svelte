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
		Download,
		X,
		Edit,
		Save,
		AlertTriangle
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let statusFilter = $state('all');
	let sortBy = $state('newest');
	let selectedTrip = $state<any>(null);
	let showModal = $state(false);
	let isEditing = $state(false);
	let editForm = $state<any>({});

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

	let filteredTrips = $derived(
		data.trips
			.filter((trip) => {
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
			})
	);

	async function handleDelete(tripId: string) {
		const warning = `⚠️ 경고: 이 작업은 되돌릴 수 없습니다!

이 여행을 삭제하면 다음 항목들도 함께 삭제됩니다:
- 모든 관련 제안 (offers)
- 모든 대화 및 메시지
- 모든 리뷰
- 여행 상태 기록

정말로 이 여행을 삭제하시겠습니까?`;

		if (!confirm(warning)) return;

		try {
			const response = await fetch(`/api/admin/trips/${tripId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				if (showModal) {
					showModal = false;
					selectedTrip = null;
				}
				window.location.reload();
			} else {
				const error = await response.json();
				alert(`삭제 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
			}
		} catch (error) {
			console.error('Error deleting trip:', error);
			alert('삭제 중 오류가 발생했습니다.');
		}
	}

	function openTripModal(trip: any) {
		selectedTrip = trip;
		showModal = true;
		isEditing = false;
	}

	function startEditing() {
		isEditing = true;
		editForm = {
			destination: selectedTrip.destination || '',
			startDate: selectedTrip.startDate
				? new Date(selectedTrip.startDate).toISOString().split('T')[0]
				: '',
			endDate: selectedTrip.endDate
				? new Date(selectedTrip.endDate).toISOString().split('T')[0]
				: '',
			people: selectedTrip.people || 1,
			tourType: selectedTrip.tourType || 'individual',
			budget: selectedTrip.budget || '',
			status: selectedTrip.status || 'draft'
		};
	}

	async function handleUpdate() {
		if (!selectedTrip) return;

		try {
			const response = await fetch(`/api/admin/trips/${selectedTrip.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			});

			if (response.ok) {
				window.location.reload();
			} else {
				const error = await response.json();
				alert(`업데이트 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
			}
		} catch (error) {
			console.error('Error updating trip:', error);
			alert('업데이트 중 오류가 발생했습니다.');
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

<div class="h-full overflow-auto p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">여행 관리</h1>
		<p class="mt-2 text-gray-600">등록된 모든 여행을 관리하고 모니터링합니다</p>
	</div>

	<!-- Statistics Cards -->
	<div class="mb-8 grid gap-4 md:grid-cols-6">
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
	<div class="mb-6 rounded-lg bg-white p-4 shadow">
		<div class="flex flex-wrap items-center gap-4">
			<div class="min-w-[200px] flex-1">
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
							날짜
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							인원/유형
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							예산
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							제안
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							상태
						</th>
						<th
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							작업
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each filteredTrips as trip}
						{@const badge = getStatusBadge(trip.status)}
						<tr class="hover:bg-gray-50">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="flex items-center">
									<MapPin class="mr-2 h-5 w-5 text-gray-400" />
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
									<Users class="mr-1 h-4 w-4 text-gray-400" />
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
								<span
									class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold {badge.bg} {badge.text}"
								>
									{badge.label}
								</span>
							</td>
							<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
								<div class="flex items-center gap-2">
									<button
										onclick={() => openTripModal(trip)}
										class="text-blue-600 hover:text-blue-900"
										title="상세보기"
									>
										<Eye class="h-4 w-4" />
									</button>
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
								{searchQuery || statusFilter !== 'all'
									? '검색 결과가 없습니다.'
									: '등록된 여행이 없습니다.'}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Trip Details Modal -->
	{#if showModal && selectedTrip}
		<div class="fixed inset-0 z-50 overflow-y-auto">
			<div class="flex min-h-screen items-center justify-center p-4">
				<!-- Background overlay -->
				<div
					class="bg-opacity-50 fixed inset-0 bg-black transition-opacity"
					onclick={() => (showModal = false)}
				></div>

				<!-- Modal content -->
				<div
					class="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl"
				>
					<!-- Modal header -->
					<div class="flex items-center justify-between border-b p-6">
						<h3 class="text-2xl font-bold text-gray-900">
							{isEditing ? '여행 수정' : '여행 상세 정보'}
						</h3>
						<div class="flex items-center gap-2">
							{#if !isEditing}
								<button
									onclick={startEditing}
									class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
								>
									<Edit class="h-4 w-4" />
									수정
								</button>
							{:else}
								<button
									onclick={handleUpdate}
									class="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
								>
									<Save class="h-4 w-4" />
									저장
								</button>
								<button
									onclick={() => (isEditing = false)}
									class="rounded-lg bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400"
								>
									취소
								</button>
							{/if}
							<button onclick={() => (showModal = false)} class="text-gray-400 hover:text-gray-600">
								<X class="h-6 w-6" />
							</button>
						</div>
					</div>

					<!-- Modal body -->
					<div class="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
						{#if isEditing}
							<!-- Edit form -->
							<div class="grid gap-6 md:grid-cols-2">
								<div>
									<label class="mb-2 block text-sm font-medium text-gray-700"> 여행지 </label>
									<input
										type="text"
										bind:value={editForm.destination}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
									/>
								</div>

								<div>
									<label class="mb-2 block text-sm font-medium text-gray-700"> 상태 </label>
									<select
										bind:value={editForm.status}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
									>
										<option value="draft">초안</option>
										<option value="submitted">제출됨</option>
										<option value="accepted">수락됨</option>
										<option value="completed">완료됨</option>
										<option value="cancelled">취소됨</option>
									</select>
								</div>

								<div>
									<label class="mb-2 block text-sm font-medium text-gray-700"> 시작일 </label>
									<input
										type="date"
										bind:value={editForm.startDate}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
									/>
								</div>

								<div>
									<label class="mb-2 block text-sm font-medium text-gray-700"> 종료일 </label>
									<input
										type="date"
										bind:value={editForm.endDate}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
									/>
								</div>

								<div>
									<label class="mb-2 block text-sm font-medium text-gray-700"> 인원 </label>
									<input
										type="number"
										min="1"
										bind:value={editForm.people}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
									/>
								</div>

								<div>
									<label class="mb-2 block text-sm font-medium text-gray-700"> 여행 유형 </label>
									<select
										bind:value={editForm.tourType}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
									>
										<option value="individual">개인 여행</option>
										<option value="group">그룹 여행</option>
										<option value="both">둘 다 가능</option>
									</select>
								</div>

								<div>
									<label class="mb-2 block text-sm font-medium text-gray-700"> 예산 </label>
									<input
										type="number"
										min="0"
										bind:value={editForm.budget}
										class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
									/>
								</div>
							</div>
						{:else}
							<!-- View mode -->
							<div class="space-y-6">
								<!-- Basic info -->
								<div class="grid gap-4 md:grid-cols-2">
									<div class="rounded-lg bg-gray-50 p-4">
										<h4 class="mb-1 text-sm font-medium text-gray-600">여행 ID</h4>
										<p class="text-sm text-gray-900">{selectedTrip.id}</p>
									</div>

									<div class="rounded-lg bg-gray-50 p-4">
										<h4 class="mb-1 text-sm font-medium text-gray-600">상태</h4>
										<span
											class="inline-flex rounded-full px-3 py-1 text-sm font-semibold {getStatusBadge(
												selectedTrip.status
											).bg} {getStatusBadge(selectedTrip.status).text}"
										>
											{getStatusBadge(selectedTrip.status).label}
										</span>
									</div>
								</div>

								<!-- Traveler info -->
								<div class="border-t pt-6">
									<h4 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
										<Users class="h-5 w-5" />
										여행자 정보
									</h4>
									<div class="grid gap-4 md:grid-cols-2">
										<div>
											<p class="text-sm text-gray-600">이름</p>
											<p class="font-medium">{selectedTrip.travelerName || '이름 없음'}</p>
										</div>
										<div>
											<p class="text-sm text-gray-600">이메일</p>
											<p class="font-medium">{selectedTrip.travelerEmail || '이메일 없음'}</p>
										</div>
									</div>
								</div>

								<!-- Trip details -->
								<div class="border-t pt-6">
									<h4 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
										<Plane class="h-5 w-5" />
										여행 상세 정보
									</h4>
									<div class="grid gap-4 md:grid-cols-2">
										<div>
											<p class="flex items-center gap-1 text-sm text-gray-600">
												<MapPin class="h-4 w-4" />
												여행지
											</p>
											<p class="font-medium">{selectedTrip.destination || '미지정'}</p>
										</div>
										<div>
											<p class="flex items-center gap-1 text-sm text-gray-600">
												<Calendar class="h-4 w-4" />
												날짜
											</p>
											<p class="font-medium">
												{#if selectedTrip.startDate && selectedTrip.endDate}
													{formatDate(selectedTrip.startDate)} ~ {formatDate(selectedTrip.endDate)}
												{:else}
													미정
												{/if}
											</p>
										</div>
										<div>
											<p class="flex items-center gap-1 text-sm text-gray-600">
												<Users class="h-4 w-4" />
												인원
											</p>
											<p class="font-medium">{selectedTrip.people || 0}명</p>
										</div>
										<div>
											<p class="text-sm text-gray-600">여행 유형</p>
											<p class="font-medium">{getTourTypeLabel(selectedTrip.tourType)}</p>
										</div>
										<div>
											<p class="flex items-center gap-1 text-sm text-gray-600">
												<DollarSign class="h-4 w-4" />
												예산
											</p>
											<p class="font-medium">{formatCurrency(selectedTrip.budget)}</p>
										</div>
										<div>
											<p class="text-sm text-gray-600">제안 수</p>
											<p class="font-medium">
												{selectedTrip.offerCount || 0}개
												{#if selectedTrip.acceptedOfferId}
													<span class="text-sm text-green-600"> (1개 수락됨)</span>
												{/if}
											</p>
										</div>
									</div>
								</div>

								<!-- Timestamps -->
								<div class="border-t pt-6">
									<h4 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
										<Clock class="h-5 w-5" />
										시간 정보
									</h4>
									<div class="grid gap-4 md:grid-cols-2">
										<div>
											<p class="text-sm text-gray-600">생성일</p>
											<p class="font-medium">{formatDate(selectedTrip.createdAt)}</p>
										</div>
										<div>
											<p class="text-sm text-gray-600">수정일</p>
											<p class="font-medium">{formatDate(selectedTrip.updatedAt)}</p>
										</div>
									</div>
								</div>

								<!-- Delete button -->
								<div class="border-t pt-6">
									<div class="rounded-lg border border-red-200 bg-red-50 p-4">
										<div class="flex items-center gap-3">
											<AlertTriangle class="h-5 w-5 flex-shrink-0 text-red-600" />
											<div class="flex-1">
												<h5 class="font-semibold text-red-800">위험 구역</h5>
												<p class="mt-1 text-sm text-red-700">
													여행을 삭제하면 모든 관련 데이터(제안, 대화, 리뷰 등)도 함께 삭제됩니다.
												</p>
											</div>
											<button
												onclick={() => handleDelete(selectedTrip.id)}
												class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
											>
												<Trash2 class="h-4 w-4" />
												여행 삭제
											</button>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

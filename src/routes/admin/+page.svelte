<script lang="ts">
	import type { PageData } from './$types';
	import {
		Users,
		Shield,
		MapPin,
		FileText,
		TrendingUp,
		DollarSign,
		Calendar,
		CheckCircle,
		XCircle,
		Clock,
		Activity
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

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
</script>

<div class="p-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">대시보드</h1>
		<p class="mt-2 text-gray-600">플랫폼 현황을 한눈에 확인하세요</p>
	</div>

	<!-- User Statistics -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">사용자 통계</h2>
		<div class="grid gap-4 md:grid-cols-5">
			<div class="rounded-lg bg-white p-6 shadow">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">전체 사용자</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.users.total}명</p>
					</div>
					<Users class="h-10 w-10 text-blue-500" />
				</div>
			</div>

			<div class="rounded-lg bg-white p-6 shadow">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">여행자</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.users.travelers}명</p>
					</div>
					<Users class="h-10 w-10 text-green-500" />
				</div>
			</div>

			<div class="rounded-lg bg-white p-6 shadow">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">가이드</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.users.guides}명</p>
						<p class="mt-1 text-xs text-gray-500">인증: {data.stats.verifiedGuides}명</p>
					</div>
					<Shield class="h-10 w-10 text-purple-500" />
				</div>
			</div>

			<div class="rounded-lg bg-white p-6 shadow">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">관리자</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.users.admins}명</p>
					</div>
					<Shield class="h-10 w-10 text-red-500" />
				</div>
			</div>

			<div class="rounded-lg bg-white p-6 shadow">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-600">신규 가입 (30일)</p>
						<p class="text-2xl font-bold text-gray-900">{data.stats.newUsers}명</p>
					</div>
					<TrendingUp class="h-10 w-10 text-emerald-500" />
				</div>
			</div>
		</div>
	</div>

	<!-- Trip and Offer Statistics -->
	<div class="mb-8 grid gap-8 lg:grid-cols-2">
		<!-- Trip Statistics -->
		<div>
			<h2 class="mb-4 text-xl font-semibold text-gray-900">여행 통계</h2>
			<div class="rounded-lg bg-white p-6 shadow">
				<div class="mb-6">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm text-gray-600">전체 여행</span>
						<span class="text-xl font-bold text-gray-900">{data.stats.trips.total}건</span>
					</div>
					<div class="mb-1 text-xs text-gray-500">신규 (30일): {data.stats.newTrips}건</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<Clock class="mr-2 h-4 w-4 text-gray-400" />
							<span class="text-sm text-gray-600">초안</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.trips.draft}건</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<FileText class="mr-2 h-4 w-4 text-blue-400" />
							<span class="text-sm text-gray-600">제출됨</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.trips.submitted}건</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<CheckCircle class="mr-2 h-4 w-4 text-green-400" />
							<span class="text-sm text-gray-600">수락됨</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.trips.accepted}건</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<CheckCircle class="mr-2 h-4 w-4 text-emerald-400" />
							<span class="text-sm text-gray-600">완료됨</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.trips.completed}건</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<XCircle class="mr-2 h-4 w-4 text-red-400" />
							<span class="text-sm text-gray-600">취소됨</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.trips.cancelled}건</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Offer Statistics -->
		<div>
			<h2 class="mb-4 text-xl font-semibold text-gray-900">오퍼 통계</h2>
			<div class="rounded-lg bg-white p-6 shadow">
				<div class="mb-6">
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm text-gray-600">전체 오퍼</span>
						<span class="text-xl font-bold text-gray-900">{data.stats.offers.total}건</span>
					</div>
				</div>

				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<Clock class="mr-2 h-4 w-4 text-yellow-400" />
							<span class="text-sm text-gray-600">대기중</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.offers.pending}건</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<CheckCircle class="mr-2 h-4 w-4 text-green-400" />
							<span class="text-sm text-gray-600">수락됨</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.offers.accepted}건</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<XCircle class="mr-2 h-4 w-4 text-red-400" />
							<span class="text-sm text-gray-600">거절됨</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.offers.rejected}건</span>
					</div>

					<div class="flex items-center justify-between">
						<div class="flex items-center">
							<XCircle class="mr-2 h-4 w-4 text-gray-400" />
							<span class="text-sm text-gray-600">취소됨</span>
						</div>
						<span class="text-sm font-medium text-gray-900">{data.stats.offers.cancelled}건</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Revenue and Destinations -->
	<div class="mb-8 grid gap-4 md:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">총 수익</p>
					<p class="text-2xl font-bold text-gray-900">
						{formatCurrency(data.stats.payments.totalRevenue)}
					</p>
					<p class="mt-1 text-xs text-gray-500">
						성공: {formatCurrency(data.stats.payments.succeeded)}
					</p>
				</div>
				<DollarSign class="h-10 w-10 text-green-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">대기중 결제</p>
					<p class="text-2xl font-bold text-gray-900">
						{formatCurrency(data.stats.payments.pending)}
					</p>
				</div>
				<Clock class="h-10 w-10 text-yellow-500" />
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm text-gray-600">등록된 여행지</p>
					<p class="text-2xl font-bold text-gray-900">{data.stats.destinations}곳</p>
				</div>
				<MapPin class="h-10 w-10 text-pink-500" />
			</div>
		</div>
	</div>

	<!-- Recent Activity -->
	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Recent Users -->
		<div>
			<h2 class="mb-4 flex items-center text-xl font-semibold text-gray-900">
				<Activity class="mr-2 h-5 w-5" />
				최근 가입 사용자
			</h2>
			<div class="overflow-hidden rounded-lg bg-white shadow">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가입일</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each data.recentActivity.users as user}
							<tr>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-medium text-gray-900">{user.name || '이름 없음'}</div>
									<div class="text-xs text-gray-500">{user.email}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold
										{user.role === 'admin'
											? 'bg-red-100 text-red-800'
											: user.role === 'guide'
												? 'bg-purple-100 text-purple-800'
												: 'bg-green-100 text-green-800'}"
									>
										{user.role === 'admin' ? '관리자' : user.role === 'guide' ? '가이드' : '여행자'}
									</span>
								</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
									{formatDate(user.createdAt)}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">
									최근 가입한 사용자가 없습니다
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Recent Trips -->
		<div>
			<h2 class="mb-4 flex items-center text-xl font-semibold text-gray-900">
				<Activity class="mr-2 h-5 w-5" />
				최근 여행 신청
			</h2>
			<div class="overflow-hidden rounded-lg bg-white shadow">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">여행자</th
							>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">목적지</th
							>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
							<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신청일</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each data.recentActivity.trips as trip}
							<tr>
								<td class="px-6 py-4 text-sm font-medium whitespace-nowrap text-gray-900">
									{trip.travelerName || '이름 없음'}
								</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
									{trip.destination || '미지정'}
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold
										{trip.status === 'completed'
											? 'bg-emerald-100 text-emerald-800'
											: trip.status === 'accepted'
												? 'bg-green-100 text-green-800'
												: trip.status === 'submitted'
													? 'bg-blue-100 text-blue-800'
													: trip.status === 'cancelled'
														? 'bg-red-100 text-red-800'
														: 'bg-gray-100 text-gray-800'}"
									>
										{trip.status === 'draft'
											? '초안'
											: trip.status === 'submitted'
												? '제출됨'
												: trip.status === 'accepted'
													? '수락됨'
													: trip.status === 'completed'
														? '완료됨'
														: trip.status === 'cancelled'
															? '취소됨'
															: trip.status}
									</span>
								</td>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
									{formatDate(trip.createdAt)}
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
									최근 여행 신청이 없습니다
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="mt-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">빠른 작업</h2>
		<div class="grid gap-4 md:grid-cols-2">
			<a
				href="/admin/destinations"
				class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
			>
				<MapPin class="mb-3 h-8 w-8 text-green-500" />
				<h3 class="font-semibold text-gray-900">여행지 관리</h3>
				<p class="mt-1 text-sm text-gray-600">여행지를 추가, 수정 또는 삭제합니다</p>
			</a>

			<a
				href="/admin/users"
				class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
			>
				<Users class="mb-3 h-8 w-8 text-blue-500" />
				<h3 class="font-semibold text-gray-900">사용자 관리</h3>
				<p class="mt-1 text-sm text-gray-600">사용자 계정을 조회하고 관리합니다</p>
			</a>
		</div>
	</div>
</div>

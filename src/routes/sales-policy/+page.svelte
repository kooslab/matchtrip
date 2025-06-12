<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>판매 정책 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-8">
			<button
				onclick={() => history.back()}
				class="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
			>
				<ArrowLeft class="h-4 w-4" />
				<span>뒤로 가기</span>
			</button>
			
			<h1 class="text-3xl font-bold text-gray-900">매치트립 판매정책</h1>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="prose prose-gray max-w-none">
				<section class="mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">1. 서비스 개요</h2>
					<p class="text-gray-700 leading-relaxed">
						매치트립은 여행자가 원하는 지역과 일정에 맞춰 맞춤형 여행 요청서를 등록하면, 
						현지 가이드가 이에 대해 견적과 일정을 제안하고, 여행자가 원하는 제안을 선택하여 
						안전하게 결제하는 여행 견적 경쟁 입찰형 플랫폼입니다.
					</p>
				</section>

				<section class="mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">2. 상품 및 서비스 종류</h2>
					<!-- Mobile-friendly card layout -->
					<div class="bg-gray-50 rounded-lg p-4 space-y-3">
						<div>
							<p class="text-sm font-semibold text-gray-900 mb-1">유형</p>
							<p class="text-gray-700">여행 맞춤 견적 서비스</p>
						</div>
						<div>
							<p class="text-sm font-semibold text-gray-900 mb-1">설명</p>
							<p class="text-gray-700">여행자가 등록한 일정에 대해 현지 가이드가 제안한 맞춤 견적을 수락 시 결제</p>
						</div>
						<div>
							<p class="text-sm font-semibold text-gray-900 mb-1">결제 시점</p>
							<p class="text-gray-700">제안 선택 시점</p>
						</div>
					</div>
				</section>

				<section class="mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">3. 판매 및 결제 프로세스</h2>
					<div class="space-y-6">
						<div class="border-l-4 border-blue-500 pl-4">
							<h3 class="font-semibold text-gray-900">여행자 요청 등록</h3>
							<p class="text-gray-700 mt-1">
								원하는 여행지, 날짜, 인원, 취향 등을 입력하여 요청서 업로드
							</p>
						</div>

						<div class="border-l-4 border-blue-500 pl-4">
							<h3 class="font-semibold text-gray-900">현지 가이드 제안 등록 (입찰)</h3>
							<p class="text-gray-700 mt-1">
								여행자 요청을 열람 후, 일정·가격·제공서비스를 포함한 제안을 등록
							</p>
						</div>

						<div class="border-l-4 border-blue-500 pl-4">
							<h3 class="font-semibold text-gray-900">여행자 제안 선택</h3>
							<p class="text-gray-700 mt-1">
								가격, 일정, 리뷰, 커뮤니케이션 등을 고려해 제안을 수락
							</p>
						</div>

						<div class="border-l-4 border-blue-500 pl-4">
							<h3 class="font-semibold text-gray-900">결제 진행</h3>
							<ul class="list-disc list-inside text-gray-700 mt-1 space-y-1">
								<li>제안 수락 시점에 매치트립 플랫폼 내 안전결제 시스템을 통해 선결제</li>
								<li>결제 금액은 매치트립이 예치(PG사 에스크로 연동 가능)</li>
							</ul>
						</div>

						<div class="border-l-4 border-blue-500 pl-4">
							<h3 class="font-semibold text-gray-900">여행 종료 후 정산</h3>
							<p class="text-gray-700 mt-1">
								일정 완료 및 여행자 만족 확인 후, 가이드에게 정산 송금 (T+일 기준)
							</p>
						</div>
					</div>
				</section>

				<section class="mb-8">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">4. 취소 및 환불 정책</h2>
					<!-- Mobile-friendly card layout -->
					<div class="space-y-4">
						<!-- 결제 전 -->
						<div class="bg-gray-50 rounded-lg p-4">
							<h3 class="font-semibold text-gray-900 mb-2">결제 전</h3>
							<div class="space-y-2">
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">조건:</span>
									<span class="text-sm text-gray-700">제안 수락 전</span>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">환불:</span>
									<span class="text-sm text-gray-700">전액 환불 가능 (요청 철회)</span>
								</div>
							</div>
						</div>

						<!-- 결제 후 ~ 여행 7일 전 -->
						<div class="bg-white border border-gray-200 rounded-lg p-4">
							<h3 class="font-semibold text-gray-900 mb-2">결제 후 ~ 여행 7일 전</h3>
							<div class="space-y-2">
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">조건:</span>
									<span class="text-sm text-gray-700">개인 사정, 일정 변경 등</span>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">환불:</span>
									<span class="text-sm text-gray-700 font-bold">90% 환불 (10% 위약금)</span>
								</div>
							</div>
						</div>

						<!-- 여행 6일~2일 전 -->
						<div class="bg-gray-50 rounded-lg p-4">
							<h3 class="font-semibold text-gray-900 mb-2">여행 6일~2일 전</h3>
							<div class="space-y-2">
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">환불:</span>
									<span class="text-sm text-gray-700 font-bold">50% 환불</span>
								</div>
							</div>
						</div>

						<!-- 여행 1일 전~당일 -->
						<div class="bg-white border border-gray-200 rounded-lg p-4">
							<h3 class="font-semibold text-gray-900 mb-2">여행 1일 전~당일</h3>
							<div class="space-y-2">
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">환불:</span>
									<span class="text-sm text-gray-700 font-bold">환불 불가</span>
								</div>
								<p class="text-xs text-gray-500 mt-1">단, 가이드 미이행 시 전액 환불</p>
							</div>
						</div>

						<!-- 가이드 측 취소 -->
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
							<h3 class="font-semibold text-gray-900 mb-2">가이드 측 취소</h3>
							<div class="space-y-2">
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">조건:</span>
									<span class="text-sm text-gray-700">불가피한 상황</span>
								</div>
								<div class="flex items-start gap-2">
									<span class="text-sm font-medium text-gray-600 shrink-0">환불:</span>
									<span class="text-sm text-gray-700 font-bold">전액 환불 및 대체 제안 제공</span>
								</div>
							</div>
						</div>
					</div>
					<p class="mt-4 text-sm text-gray-600">
						※ 에스크로 연동 시 PG사 표준 환불 프로세스에 따릅니다.
					</p>
				</section>
			</div>
		</div>
	</div>
</div>
<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>환불약관 - 매치트립</title>
	<meta name="description" content="매치트립 서비스 환불 정책" />
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl bg-white shadow-sm">
		<!-- Header -->
		<header class="sticky top-0 z-10 border-b bg-white px-4 py-4">
			<div class="flex items-center gap-4">
				<a href="/" class="rounded-full p-2 hover:bg-gray-100">
					<ArrowLeft class="h-5 w-5" />
				</a>
				<h1 class="text-lg font-semibold">환불약관</h1>
			</div>
		</header>

		<!-- Content -->
		<main class="px-6 py-8">
			<div class="prose prose-sm max-w-none">
				<h2 class="mb-6 text-2xl font-bold">매치트립 환불약관 (Refund Terms of Use)</h2>

				<p class="mb-4">
					본 약관은 「매치트립 이용약관」에 근거하여 매치트립 플랫폼을 통해 예약된 모든 체험 및 여행
					서비스의 환불 기준, 처리 절차, 권리·의무에 대해 규정합니다.
				</p>
				<p class="mb-6">
					에이전트티 (이하 "회사")는 매치트립 플랫폼의 운영자로서, 이용자(이하 "여행자")와 서비스
					제공자(이하 "가이드") 간 체결된 체험 이용 계약에 관한 환불을 아래 기준에 따라 처리합니다.
				</p>

				<h3 class="mt-8 text-lg font-semibold">제1조 (적용 범위)</h3>
				<ol class="list-decimal space-y-2 pl-6">
					<li>
						본 약관은 여행자가 매치트립을 통해 예약한 모든 유료 체험 및 투어 서비스에 적용됩니다.
					</li>
					<li>
						가이드가 별도로 설정한 환불 조건이 여행자에게 명확히 고지되었고 동의가 이루어진 경우,
						해당 조건이 본 약관보다 우선 적용됩니다. 단, 소비자 보호를 위해 회사는 이를 제한할 수
						있습니다.
					</li>
				</ol>

				<h3 class="mt-8 text-lg font-semibold">제2조 (환불 요청 사유 및 기준)</h3>

				<h4 class="mt-6 font-semibold">① 여행자 사유에 의한 환불</h4>
				<div class="ml-4">
					<p class="mb-2 font-medium">가. 데이투어</p>
					<div class="mb-4 rounded-lg bg-gray-50 p-4">
						<ul class="space-y-2 text-sm">
							<li>여행시작 30일 전까지 (~30) 통보 시 : 여행 요금 전액 환불</li>
							<li>여행시작 20일 전까지 (29~20) 통보 시 : 총 상품 금액에서 10% 공제 후 환불</li>
							<li>여행시작 6일 전까지 (19~6) 통보 시 : 총 상품 금액에서 15% 공제 후 환불</li>
							<li>여행시작 1일 전까지 (1~5) 통보 시 : 총 상품 금액에서 20% 공제 후 환불</li>
							<li>여행일 당일 ~ 투어 시작 전 통보 시: 총 상품 금액에서 50% 공제 후 환불</li>
						</ul>
					</div>
					<p class="font-medium">
						나. 차량, 호텔, 입장권, 티켓은 국외여행 특별약관 적용되어 취소,환불 불가
					</p>
				</div>

				<h4 class="mt-6 font-semibold">② 가이드의 귀책 사유에 의한 환불</h4>
				<ul class="list-disc space-y-2 pl-6">
					<li>무단 취소 또는 노쇼: 전액 환불</li>
					<li>기재된 서비스 내용과 명백히 상이한 경우: 회사의 판단에 따라 부분 또는 전액 환불</li>
					<li>불친절, 강압적 언행, 여행자 안전 위협: 증빙에 따라 환불 및 제재 조치</li>
				</ul>

				<h4 class="mt-6 font-semibold">③ 플랫폼 기술 문제에 따른 환불</h4>
				<p class="ml-6">예약 오류, 결제 누락, 시스템 장애 등 플랫폼 귀책 시: 전액 환불</p>

				<h3 class="mt-8 text-lg font-semibold">제3조 (불가항력 및 예외 상황에 따른 환불)</h3>
				<ol class="list-decimal space-y-2 pl-6">
					<li>다음 사유에 해당하는 경우, 관련 증빙자료를 제출할 경우 전액 환불이 가능합니다.</li>
				</ol>

				<div class="mt-4 overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="bg-gray-100">
								<th class="border px-4 py-2 text-left">사유</th>
								<th class="border px-4 py-2 text-left">인정 조건</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="border px-4 py-2">감염병 확산 및 정부 조치</td>
								<td class="border px-4 py-2">확진 판정서, 입국 제한 공문 등</td>
							</tr>
							<tr>
								<td class="border px-4 py-2">천재지변 (태풍, 지진 등)</td>
								<td class="border px-4 py-2">기상청 공식 통보 자료</td>
							</tr>
							<tr>
								<td class="border px-4 py-2">교통 두절</td>
								<td class="border px-4 py-2">항공·기차 취소 확인서 등</td>
							</tr>
							<tr>
								<td class="border px-4 py-2">개인 사고·상해</td>
								<td class="border px-4 py-2">병원 진단서 등으로 입증된 경우 (단순 변심은 제외)</td>
							</tr>
						</tbody>
					</table>
				</div>

				<ol class="mt-4 list-decimal space-y-2 pl-6" start="2">
					<li>불가항력 여부는 회사의 합리적 판단에 따라 결정됩니다.</li>
				</ol>

				<h3 class="mt-8 text-lg font-semibold">제4조 (환불 요청 및 처리 절차)</h3>
				<ol class="list-decimal space-y-2 pl-6">
					<li>여행자는 환불 요청을 고객센터를 통해 신청할 수 있습니다.</li>
					<li>
						가이드는 요청일로부터 72시간 이내에 수락 또는 이의제기를 해야 하며, 미응답 시 자동 승인
						처리될 수 있습니다.
					</li>
					<li>회사는 다음 기준에 따라 환불을 처리합니다:</li>
				</ol>

				<div class="mt-4 overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="bg-gray-100">
								<th class="border px-4 py-2 text-left">항목</th>
								<th class="border px-4 py-2 text-left">처리 기한</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="border px-4 py-2">환불 승인 후 카드/계좌 환급</td>
								<td class="border px-4 py-2">영업일 기준 5~10일</td>
							</tr>
							<tr>
								<td class="border px-4 py-2">PG사 수수료 발생 시 공제 여부</td>
								<td class="border px-4 py-2">결제 방식에 따라 일부 공제 가능</td>
							</tr>
						</tbody>
					</table>
				</div>

				<ol class="mt-4 list-decimal space-y-2 pl-6" start="4">
					<li>다음 경우 회사는 환불을 보류하거나 거부할 수 있습니다:</li>
				</ol>
				<ul class="mt-2 list-disc space-y-1 pl-12">
					<li>여행자의 무단 미참여, 현지 도착 실패</li>
					<li>허위 사유 제시 및 증빙 불일치</li>
					<li>후기 작성 후 변심 환불 요청</li>
				</ul>

				<h3 class="mt-8 text-lg font-semibold">제5조 (여행 종료 후 환불 제한)</h3>
				<ol class="list-decimal space-y-2 pl-6">
					<li>여행 종료 후, 서비스가 완료된 것으로 간주되어 환불이 제한됩니다.</li>
					<li>
						단, 회사가 가이드의 명백한 귀책 사유를 확인한 경우, 여행자 보호를 위해 환불조치를 할 수
						있습니다.
					</li>
				</ol>

				<h3 class="mt-8 text-lg font-semibold">제6조 (정산 및 수수료 처리)</h3>
				<ol class="list-decimal space-y-2 pl-6">
					<li>환불 발생 시 회사는 다음 항목을 고려하여 금액을 조정할 수 있습니다.</li>
				</ol>

				<div class="mt-4 overflow-x-auto">
					<table class="w-full border-collapse">
						<thead>
							<tr class="bg-gray-100">
								<th class="border px-4 py-2 text-left">항목</th>
								<th class="border px-4 py-2 text-left">공제 여부</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td class="border px-4 py-2">결제대행사(PG) 수수료</td>
								<td class="border px-4 py-2">실비 공제 가능</td>
							</tr>
							<tr>
								<td class="border px-4 py-2">환불 발생 시 정산금 회수</td>
								<td class="border px-4 py-2">가이드 정산 예정액에서 차감 또는 반환 청구</td>
							</tr>
						</tbody>
					</table>
				</div>

				<ol class="mt-4 list-decimal space-y-2 pl-6" start="2">
					<li>
						가이드는 환불로 인해 발생하는 금전적 손실에 대해 회사에 이의를 제기할 수 있으며, 필요 시
						별도 협의 절차를 거칩니다.
					</li>
				</ol>

				<h3 class="mt-8 text-lg font-semibold">제7조 (분쟁 조정 및 최종 권한)</h3>
				<ol class="list-decimal space-y-2 pl-6">
					<li>
						본 환불 약관 해석 및 적용과 관련한 분쟁은 회사가 합리적으로 중재하며,
						당사자(가이드/여행자)는 이에 협조합니다.
					</li>
					<li>
						모든 분쟁은 「대한민국 민법」 및 「전자상거래법」에 따라 해결되며, 관할 법원은 회사 본사
						소재지(서울중앙지방법원)로 합니다.
					</li>
				</ol>

				<div class="mt-12 rounded-lg bg-gray-100 p-6">
					<h3 class="font-semibold">[부칙]</h3>
					<p class="mt-2">본 약관은 2025년 8월 1일부터 시행합니다.</p>
					<p class="mt-4">
						회사는 필요한 경우 사전 고지 후 본 약관을 변경할 수 있으며, 변경 고지 후 서비스 이용을
						지속하는 경우, 변경 사항에 동의한 것으로 간주됩니다.
					</p>
				</div>
			</div>
		</main>
	</div>
</div>

<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>환불약관 - MatchTrip</title>
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

			<h1 class="text-3xl font-bold text-gray-900">매치트립 환불약관 (Refund Terms of Use)</h1>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm">
			<div class="prose prose-gray max-w-none">
				<p class="leading-relaxed text-gray-700">
					본 약관은 「매치트립 이용약관」에 근거하여 매치트립 플랫폼을 통해 예약된 모든 체험 및 여행
					서비스의 환불 기준, 처리 절차, 권리·의무에 대해 규정합니다.
				</p>
				<p class="leading-relaxed text-gray-700">
					에이전트티 주식회사(이하 "회사")는 매치트립 플랫폼의 운영자로서, 이용자(이하 "여행자")와
					서비스 제공자(이하 "가이드") 간 체결된 체험 이용 계약에 관한 환불을 아래 기준에 따라
					처리합니다.
				</p>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">제1조 (적용 범위)</h2>
					<ol class="list-inside list-decimal space-y-2">
						<li>
							본 약관은 여행자가 매치트립을 통해 예약한 모든 유료 체험 및 투어 서비스에 적용됩니다.
						</li>
						<li>
							가이드가 별도로 설정한 환불 조건이 여행자에게 명확히 고지되었고 동의가 이루어진 경우,
							해당 조건이 본 약관보다 우선 적용됩니다. 단, 소비자 보호를 위해 회사는 이를 제한할 수
							있습니다.
						</li>
					</ol>
				</section>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">제2조 (환불 요청 사유 및 기준)</h2>

					<h3 class="mb-3 text-lg font-semibold text-gray-800">① 여행자 사유에 의한 환불</h3>
					<div class="mb-6 overflow-x-auto">
						<table class="min-w-full border border-gray-200 bg-white">
							<thead class="bg-gray-50">
								<tr>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>취소 시점</th
									>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>환불 금액</th
									>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>비고</th
									>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>예약 확정 후 48시간 이내<br />& 체험 7일 전까지</td
									>
									<td class="border-b px-4 py-3 text-sm font-semibold text-gray-900">100% 환불</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600">플랫폼 수수료 포함 전액</td>
								</tr>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">체험 7일~3일 전</td>
									<td class="border-b px-4 py-3 text-sm font-semibold text-gray-900">50% 환불</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600">-</td>
								</tr>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">체험 2일 전~당일</td>
									<td class="border-b px-4 py-3 text-sm font-semibold text-gray-900">환불 불가</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>단, 제3조 예외 상황에<br />해당 시 별도 처리</td
									>
								</tr>
							</tbody>
						</table>
					</div>

					<h3 class="mb-3 text-lg font-semibold text-gray-800">② 가이드의 귀책 사유에 의한 환불</h3>
					<ul class="mb-6 list-inside list-disc space-y-2">
						<li>무단 취소 또는 노쇼: 전액 환불 + 후속 페널티</li>
						<li>기재된 서비스 내용과 명백히 상이한 경우: 회사의 판단에 따라 부분 또는 전액 환불</li>
						<li>불친절, 강압적 언행, 여행자 안전 위협: 증빙에 따라 환불 및 제재 조치</li>
					</ul>

					<h3 class="mb-3 text-lg font-semibold text-gray-800">③ 플랫폼 기술 문제에 따른 환불</h3>
					<ul class="list-inside list-disc">
						<li>예약 오류, 결제 누락, 시스템 장애 등 플랫폼 귀책 시: 전액 환불</li>
					</ul>
				</section>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">
						제3조 (불가항력 및 예외 상황에 따른 환불)
					</h2>
					<p class="mb-3">
						① 다음 사유에 해당하는 경우, 관련 증빙자료를 제출할 경우 전액 환불이 가능합니다.
					</p>

					<div class="mb-4 overflow-x-auto">
						<table class="min-w-full border border-gray-200 bg-white">
							<thead class="bg-gray-50">
								<tr>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>사유</th
									>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>인정 조건</th
									>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">감염병 확산 및 정부 조치</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>확진 판정서, 입국 제한 공문 등</td
									>
								</tr>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">천재지변 (태풍, 지진 등)</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600">기상청 공식 통보 자료</td>
								</tr>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">교통 두절</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600">항공·기차 취소 확인서 등</td>
								</tr>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">개인 사고·상해</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>병원 진단서 등으로 입증된 경우 (단순 변심은 제외)</td
									>
								</tr>
							</tbody>
						</table>
					</div>

					<p>② 불가항력 여부는 회사의 합리적 판단에 따라 결정됩니다.</p>
				</section>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">제4조 (환불 요청 및 처리 절차)</h2>
					<ol class="mb-4 list-inside list-decimal space-y-2">
						<li>여행자는 환불 요청을 고객센터를 통해 신청할 수 있습니다.</li>
						<li>
							가이드는 요청일로부터 72시간 이내에 수락 또는 이의제기를 해야 하며, 미응답 시 자동
							승인 처리될 수 있습니다.
						</li>
						<li>회사는 다음 기준에 따라 환불을 처리합니다:</li>
					</ol>

					<div class="mb-4 overflow-x-auto">
						<table class="min-w-full border border-gray-200 bg-white">
							<thead class="bg-gray-50">
								<tr>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>항목</th
									>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>처리 기한</th
									>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>환불 승인 후 카드/계좌 환급</td
									>
									<td class="border-b px-4 py-3 text-sm text-gray-600">영업일 기준 5~10일</td>
								</tr>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>PG사 수수료 발생 시 공제 여부</td
									>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>결제 방식에 따라 일부 공제 가능</td
									>
								</tr>
							</tbody>
						</table>
					</div>

					<p class="mb-2">④ 다음 경우 회사는 환불을 보류하거나 거부할 수 있습니다:</p>
					<ul class="list-inside list-disc space-y-1">
						<li>여행자의 무단 미참여, 현지 도착 실패</li>
						<li>허위 사유 제시 및 증빙 불일치</li>
						<li>후기 작성 후 변심 환불 요청</li>
					</ul>
				</section>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">
						제5조 (부분 이용 또는 체험 중단 시)
					</h2>
					<ol class="list-inside list-decimal space-y-2">
						<li>
							여행자가 단순 변심 또는 개인 사정으로 일부만 체험한 경우, 해당 사유가 가이드 귀책이
							아닌 이상 환불되지 않습니다.
						</li>
						<li>
							체험 중 불가피한 중단이 발생할 경우(현장 사고, 기상 악화 등), 회사는 다음과 같이
							조치합니다:
							<ul class="mt-2 ml-4 list-inside list-disc space-y-1">
								<li>체험 시간의 50% 미만 진행: 부분 환불</li>
								<li>체험 시작 후 50% 이상 진행: 환불 불가</li>
								<li>단, 가이드의 사전 설명 부족 또는 현장 대응 미흡 시 예외 적용 가능</li>
							</ul>
						</li>
					</ol>
				</section>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">제6조 (여행 종료 후 환불 제한)</h2>
					<ol class="list-inside list-decimal space-y-2">
						<li>여행 종료 후, 서비스가 완료된 것으로 간주되어 환불이 제한됩니다.</li>
						<li>
							단, 회사가 가이드의 명백한 귀책 사유를 확인한 경우, 여행자 보호를 위해 환불조치를 할
							수 있습니다.
						</li>
					</ol>
				</section>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">제7조 (정산 및 수수료 처리)</h2>
					<p class="mb-3">① 환불 발생 시 회사는 다음 항목을 고려하여 금액을 조정할 수 있습니다.</p>

					<div class="mb-4 overflow-x-auto">
						<table class="min-w-full border border-gray-200 bg-white">
							<thead class="bg-gray-50">
								<tr>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>항목</th
									>
									<th class="border-b px-4 py-3 text-left text-sm font-medium text-gray-700"
										>공제 여부</th
									>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">결제대행사(PG) 수수료</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600">실비 공제 가능</td>
								</tr>
								<tr>
									<td class="border-b px-4 py-3 text-sm text-gray-600">환불 발생 시 정산금 회수</td>
									<td class="border-b px-4 py-3 text-sm text-gray-600"
										>가이드 정산 예정액에서 차감 또는 반환 청구</td
									>
								</tr>
							</tbody>
						</table>
					</div>

					<p>
						② 가이드는 환불로 인해 발생하는 금전적 손실에 대해 회사에 이의를 제기할 수 있으며, 필요
						시 별도 협의 절차를 거칩니다.
					</p>
				</section>

				<section class="mb-8">
					<h2 class="mb-4 text-xl font-semibold text-gray-900">제8조 (분쟁 조정 및 최종 권한)</h2>
					<ol class="list-inside list-decimal space-y-2">
						<li>
							본 환불 약관 해석 및 적용과 관련한 분쟁은 회사가 합리적으로 중재하며,
							당사자(가이드/여행자)는 이에 협조합니다.
						</li>
						<li>
							모든 분쟁은 「대한민국 민법」 및 「전자상거래법」에 따라 해결되며, 관할 법원은 회사
							본사 소재지(서울중앙지방법원)로 합니다.
						</li>
					</ol>
				</section>

				<div class="mt-8 rounded-lg bg-gray-50 p-4">
					<h3 class="mb-2 font-semibold text-gray-900">[부칙]</h3>
					<ol class="list-inside list-decimal space-y-2 text-sm text-gray-700">
						<li>본 약관은 2025년 8월 1일부터 시행합니다.</li>
						<li>
							회사는 필요한 경우 사전 고지 후 본 약관을 변경할 수 있으며, 변경 고지 후 서비스 이용을
							지속하는 경우, 변경 사항에 동의한 것으로 간주됩니다.
						</li>
					</ol>
				</div>
			</div>
		</div>
	</div>
</div>

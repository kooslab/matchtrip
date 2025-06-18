<script lang="ts">
	// Add navigation
	import { goto } from '$app/navigation';

	function goBack() {
		window.history.back();
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-12">
	<button onclick={goBack} class="mb-6 flex items-center text-blue-500 hover:text-blue-700">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="mr-2 h-5 w-5"
			viewBox="0 0 20 20"
			fill="currentColor">
			<path
				fill-rule="evenodd"
				d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
				clip-rule="evenodd" />
		</svg>
		뒤로 가기
	</button>

	<h1 class="mb-6 text-2xl font-bold text-gray-800">개인정보처리방침 (Privacy Policy)</h1>

	<div class="prose max-w-none rounded-md border border-gray-200 bg-white p-6 shadow-sm">
		<p class="lead">
			에이전트티 주식회사(이하 "회사" 또는 "당사")는 이용자의 개인정보를 소중하게 생각하며,
			「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을
			준수하여 이용자의 개인정보를 안전하게 보호하고 있습니다.
		</p>
		<p>
			본 개인정보처리방침은 회사가 운영하는 매치트립(MatchTrip) 플랫폼(웹사이트 및 모바일 앱 포함)을
			통해 수집하는 개인정보의 처리 방식에 대해 설명합니다.
		</p>

		<h2>제1조 (수집하는 개인정보 항목)</h2>
		<p>회사는 다음과 같은 항목의 개인정보를 수집합니다.</p>

		<h3>1. 회원가입 및 서비스 이용 시</h3>
		<ul>
			<li><strong>필수항목:</strong> 이름, 이메일 주소, 휴대폰 번호</li>
			<li><strong>선택항목:</strong> 생년월일, 성별, 프로필 사진, 언어, SNS 계정 연동 정보</li>
		</ul>

		<h3>2. 결제 및 정산</h3>
		<ul>
			<li>
				<strong>가이드:</strong> 본인 확인 정보(신분증 사본, 사업자등록번호 등), 정산 계좌 정보
			</li>
		</ul>

		<h3>3. 고객센터 및 문의 대응</h3>
		<ul>
			<li>
				<strong>수집 항목:</strong> 이름, 이메일 주소, 통화 내용 또는 채팅 로그, 문제 발생 시 기기 정보
			</li>
		</ul>

		<h3>4. 자동 수집 정보</h3>
		<ul>
			<li>IP 주소, 쿠키, 브라우저 종류, OS, 방문 일시, 이용기록, 접속 로그, 기기 식별자</li>
		</ul>

		<h2>제2조 (개인정보 수집 방법)</h2>
		<ul>
			<li>플랫폼 회원가입 시 웹/모바일 입력</li>
			<li>예약, 결제, 후기 작성 등 서비스 이용 시</li>
			<li>고객센터 상담 및 신고 처리 시</li>
			<li>자동화된 수단(쿠키, 로그분석 도구 등)</li>
		</ul>

		<h2>제3조 (개인정보 이용 목적)</h2>
		<p>회사는 수집한 개인정보를 다음의 목적을 위해 사용합니다.</p>
		<ul>
			<li><strong>회원관리:</strong> 본인확인, 중복가입 방지, 이용자 식별</li>
			<li><strong>서비스 제공:</strong> 예약 처리, 가이드와의 연결, 결제 및 정산</li>
			<li><strong>고객지원:</strong> 문의 및 민원 응대, 서비스 오류 해결</li>
			<li>
				<strong>마케팅 및 분석(선택 동의 시):</strong> 서비스 개선, 통계 분석, 프로모션 정보 제공
			</li>
			<li><strong>법적 의무 이행:</strong> 전자상거래 등 관련 법령 준수</li>
		</ul>

		<h2>제4조 (개인정보의 제3자 제공)</h2>
		<p>
			회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외로
			합니다.
		</p>

		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="border-b">
						<th class="px-2 py-2 text-left">제공받는 자</th>
						<th class="px-2 py-2 text-left">제공 항목</th>
						<th class="px-2 py-2 text-left">제공 목적</th>
						<th class="px-2 py-2 text-left">보유 및 이용 기간</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b">
						<td class="px-2 py-2">예약된 가이드<br />(여행자에 한함)</td>
						<td class="px-2 py-2">이름, 연락처,<br />기타 요청사항</td>
						<td class="px-2 py-2">서비스 제공 및<br />현장 연락</td>
						<td class="px-2 py-2">여행 종료 후 7일</td>
					</tr>
					<tr class="border-b">
						<td class="px-2 py-2">여행자<br />(가이드에 한함)</td>
						<td class="px-2 py-2">이름, 연락처,<br />예약정보</td>
						<td class="px-2 py-2">서비스 이행 및<br />고객 응대</td>
						<td class="px-2 py-2">여행 종료 후 7일</td>
					</tr>
					<tr>
						<td class="px-2 py-2">관련 법령상<br />요구 기관</td>
						<td class="px-2 py-2">관련 정보 일체</td>
						<td class="px-2 py-2">수사, 재판,<br />세금 관련 등<br />법령상 의무</td>
						<td class="px-2 py-2">관계 법령에 따름</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="mt-2 text-sm text-gray-600">
			※ 사전 동의를 받은 경우 외에는 제3자에게 정보를 제공하지 않으며, 제공 시에는 이용자에게 별도로
			고지합니다.
		</p>

		<h2>제5조 (개인정보 처리의 위탁)</h2>
		<p>회사는 원활한 서비스 제공을 위해 다음과 같이 일부 업무를 외부에 위탁하고 있습니다.</p>

		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="border-b">
						<th class="px-2 py-2 text-left">수탁업체</th>
						<th class="px-2 py-2 text-left">위탁업무 내용</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b">
						<td class="px-2 py-2">Amazon Web Services</td>
						<td class="px-2 py-2">데이터 보관 및 클라우드 인프라</td>
					</tr>
					<tr class="border-b">
						<td class="px-2 py-2">(PG사) 토스페이먼츠, 카카오페이</td>
						<td class="px-2 py-2">결제 및 정산 처리</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="mt-2 text-sm text-gray-600">
			※ 회사는 수탁업체가 개인정보를 안전하게 처리하도록 관리·감독합니다.
		</p>

		<h2>제6조 (개인정보의 보유 및 이용 기간)</h2>
		<p>회사는 수집한 개인정보를 다음과 같은 기준으로 보유합니다.</p>

		<div class="overflow-x-auto">
			<table class="min-w-full">
				<thead>
					<tr class="border-b">
						<th class="px-2 py-2 text-left">항목</th>
						<th class="px-2 py-2 text-left">보유기간</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b">
						<td class="px-2 py-2">회원가입 정보</td>
						<td class="px-2 py-2">회원 탈퇴 후 30일까지 보관 (사기/불법행위 방지 목적)</td>
					</tr>
					<tr class="border-b">
						<td class="px-2 py-2">예약 및 결제 정보</td>
						<td class="px-2 py-2">전자상거래법에 따라 5년</td>
					</tr>
					<tr class="border-b">
						<td class="px-2 py-2">소비자 불만 또는 분쟁처리 정보</td>
						<td class="px-2 py-2">소비자기본법에 따라 3년</td>
					</tr>
					<tr>
						<td class="px-2 py-2">로그기록 및 접속기록</td>
						<td class="px-2 py-2">통신비밀보호법에 따라 3개월</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h2>제7조 (이용자의 권리와 행사방법)</h2>
		<p>이용자는 언제든지 자신의 개인정보에 대해 다음과 같은 권리를 행사할 수 있습니다.</p>
		<ul>
			<li>개인정보 조회, 수정, 삭제, 처리 정지 요청</li>
			<li>회원탈퇴 및 개인정보 파기 요청</li>
			<li>마케팅 정보 수신 동의/철회</li>
		</ul>
		<p>요청은 플랫폼 내 '내 정보 관리' 또는 고객센터(help@agentt.kr)로 가능합니다.</p>

		<h2>제8조 (개인정보 파기 절차 및 방법)</h2>
		<p>
			회사는 개인정보 보유기간이 경과하거나 처리 목적이 달성된 경우, 지체 없이 해당 정보를
			파기합니다.
		</p>
		<ul>
			<li><strong>전자 파일:</strong> 복구 불가능한 방식으로 영구 삭제</li>
			<li><strong>서면 문서:</strong> 분쇄 또는 소각 처리</li>
		</ul>

		<h2>제9조 (개인정보의 보호조치)</h2>
		<p>
			회사는 개인정보를 안전하게 보호하기 위하여 다음과 같은 기술적 및 관리적 조치를 취하고
			있습니다.
		</p>
		<ul>
			<li>개인정보 암호화 및 접근권한 제한</li>
			<li>침입 차단 시스템을 통한 외부 침입 방지</li>
			<li>정기적인 보안 점검 및 직원 교육</li>
		</ul>

		<h2>제10조 (개인정보 보호책임자)</h2>
		<p>회사는 개인정보 보호를 총괄하는 책임자를 다음과 같이 지정하고 있습니다.</p>
		<ul>
			<li><strong>책임자:</strong> 진민수</li>
			<li><strong>소속:</strong> 개인정보보호팀</li>
			<li><strong>이메일:</strong> help@agentt.kr</li>
			<li><strong>전화번호:</strong> 010-8200-4994</li>
		</ul>

		<h2>제11조 (개인정보처리방침의 변경)</h2>
		<p>
			본 방침은 관계 법령, 회사 정책 변경에 따라 수정될 수 있으며, 변경 시 플랫폼 내 공지사항을 통해
			사전 고지합니다.
		</p>
		<ul>
			<li><strong>공고일자:</strong> 2025년 8월 1일</li>
			<li><strong>시행일자:</strong> 2025년 8월 16일</li>
		</ul>
	</div>
</div>

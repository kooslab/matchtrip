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
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
				clip-rule="evenodd"
			/>
		</svg>
		뒤로 가기
	</button>

	<h1 class="mb-6 text-2xl font-bold text-gray-800">마케팅 정보 수신 동의</h1>

	<div class="prose max-w-none rounded-md border border-gray-200 bg-white p-6 shadow-sm">
		<p class="text-lg font-medium text-blue-600">
			매치트립의 특별한 혜택과 소식을 가장 먼저 받아보세요!
		</p>

		<div class="my-6 rounded-lg bg-gray-50 p-4">
			<h2 class="text-lg font-medium text-gray-900">마케팅 정보 수신 동의 안내</h2>
			<p>
				매치트립에서 제공하는 이벤트 및 혜택 정보를 이메일, SMS 등을 통해 받아보실 수 있습니다.
				마케팅 정보 수신 동의는 선택사항이며, 동의하지 않아도 매치트립의 서비스를 이용하실 수
				있습니다.
			</p>
		</div>

		<h2>수집 항목</h2>
		<ul>
			<li>이메일 주소</li>
			<li>휴대폰 번호(선택적으로 제공한 경우)</li>
		</ul>

		<h2>이용 목적</h2>
		<ul>
			<li>새로운 서비스 및 상품 안내</li>
			<li>이벤트 정보 및 참여 기회 제공</li>
			<li>혜택 및 할인 정보 제공</li>
			<li>서비스 개선을 위한 설문 조사</li>
		</ul>

		<h2>보유 및 이용 기간</h2>
		<p>회원 탈퇴 또는 마케팅 수신 동의 철회 시까지</p>

		<div class="mt-6 rounded-lg bg-yellow-50 p-4">
			<h3 class="font-medium text-yellow-800">마케팅 정보 수신 동의 철회 방법</h3>
			<p class="text-yellow-700">마케팅 정보 수신 동의는 언제든지 철회할 수 있습니다.</p>
			<ul class="text-yellow-700">
				<li>매치트립 웹사이트 > 마이페이지 > 설정 > 마케팅 정보 수신 설정에서 변경</li>
				<li>수신된 이메일 또는 문자메시지 내 수신거부 링크 클릭</li>
				<li>고객센터 문의 (이메일: help@agentt.kr)</li>
			</ul>
		</div>

		<div class="mt-8 border-t border-gray-200 pt-6">
			<p class="text-sm text-gray-500">
				마케팅 활용 동의와 관련한 더 자세한 내용은 '개인정보 처리방침'을 확인해 주세요.
			</p>
			<a href="/terms/privacy" class="text-sm text-blue-500 hover:underline"
				>개인정보 처리방침 보기</a
			>
		</div>
	</div>
</div>

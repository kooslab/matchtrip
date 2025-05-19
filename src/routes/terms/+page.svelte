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

	<h1 class="mb-6 text-2xl font-bold text-gray-800">이용약관</h1>

	<div class="prose max-w-none rounded-md border border-gray-200 bg-white p-6 shadow-sm">
		<h2>제1조 (목적)</h2>
		<p>
			이 약관은 매치트립(이하 "회사"라 함)이 제공하는 서비스의 이용조건 및 절차, 회사와 회원 간의
			권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
		</p>

		<h2>제2조 (용어의 정의)</h2>
		<p>이 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
		<ul>
			<li>
				"서비스"란 회사가 제공하는 여행 가이드와 여행자를 연결해주는 모든 서비스를 의미합니다.
			</li>
			<li>
				"회원"이란 회사와 서비스 이용계약을 체결하고 서비스를 이용하는 모든 사용자를 의미합니다.
			</li>
			<li>"가이드"란 여행 서비스를 제공하는 회원을 의미합니다.</li>
			<li>"여행자"란 가이드의 서비스를 이용하는 회원을 의미합니다.</li>
		</ul>

		<h2>제3조 (약관의 효력과 변경)</h2>
		<p>
			회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 서비스 내에 공지함으로써 효력이
			발생합니다.
		</p>

		<h2>제4조 (서비스 이용계약의 성립)</h2>
		<p>서비스 이용계약은 회원이 약관에 동의하고 회사가 승낙함으로써 성립됩니다.</p>

		<h2>제5조 (서비스 이용)</h2>
		<p>회원은 본 약관과 관련 법령을 준수하는 범위 내에서 서비스를 자유롭게 이용할 수 있습니다.</p>

		<h2>제6조 (서비스 제공의 중단)</h2>
		<p>
			회사는 시스템 점검, 보수, 교체, 고장 등 불가피한 사유로 서비스 제공을 일시적으로 중단할 수
			있습니다.
		</p>

		<h2>제7조 (회원의 의무)</h2>
		<p>회원은 다음 행위를 해서는 안 됩니다:</p>
		<ul>
			<li>타인의 정보 도용</li>
			<li>회사가 제공하는 서비스의 운영을 방해하는 행위</li>
			<li>불법 정보의 송신 또는 게시</li>
			<li>타인의 명예를 훼손하거나 모욕하는 행위</li>
		</ul>

		<h2>제8조 (책임제한)</h2>
		<p>
			회사는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력적인 사유로 서비스를 제공할 수
			없는 경우에는 책임이 면제됩니다.
		</p>
	</div>
</div>

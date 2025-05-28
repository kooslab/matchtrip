<script lang="ts">
	// Get current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<footer class="mt-auto pt-8 pb-4 text-center text-sm text-gray-500">
	<div class="mb-4 flex w-full justify-center">
		<div class="h-px w-full bg-gray-600"></div>
	</div>
	<div class="mb-2 flex justify-center space-x-4">
		<a href="/terms" class="hover:text-gray-700 hover:underline">이용약관</a>
		<a href="/privacy" class="hover:text-gray-700 hover:underline">개인정보처리방침</a>
		<a href="/contact" class="hover:text-gray-700 hover:underline">문의하기</a>
	</div>

	<!-- Business Info Section -->
	<div class="mx-auto mb-1 flex w-full max-w-5xl flex-col items-center px-2 py-1">
		<div
			class="flex w-full flex-col gap-1 text-[11px] leading-tight md:flex-row md:items-center md:justify-between md:gap-0">
			<div class="flex items-center justify-center gap-2 text-center md:w-auto">
				<span>상호 : 에이전트티</span>
				<span>|</span>
				<span>대표 : 진민수</span>
				<span>|</span>
				<span>E-mail : j@agentt.kr</span>
			</div>
			<div class="flex flex-col md:flex-row md:items-center md:space-x-2">
				<span>주소 : 경기도 화성시 메타폴리스로 42 9층</span>
			</div>
			<div class="flex flex-col md:flex-row md:items-center md:space-x-2">
				<span>전화 : 010-8200-4994 (독일 +49 174 4360256)</span>
				<span>사업자등록번호 : 126-56-00745</span>
				<span>통신판매번호 : 2024-화성동탄-1329호</span>
			</div>
		</div>
	</div>

	<p>© {currentYear} MatchTrip. All rights reserved.</p>
</footer>

<script lang="ts">
	// Get current year for copyright
	const currentYear = new Date().getFullYear();
</script>

<footer class="mt-auto pt-8 pb-4 text-center text-sm text-gray-500">
	<div class="mb-4 flex justify-center space-x-4">
		<a href="/terms" class="hover:text-gray-700 hover:underline">이용약관</a>
		<a href="/privacy" class="hover:text-gray-700 hover:underline">개인정보처리방침</a>
		<a href="/contact" class="hover:text-gray-700 hover:underline">문의하기</a>
	</div>

	<!-- Business Info Section -->
	<div class="mx-auto mb-4 max-w-4xl px-4">
		<!-- Mobile: Stack vertically, Desktop: 2 columns -->
		<div class="text-xs text-gray-400 md:text-sm">
			<!-- Row 1: Company Info -->
			<div class="mb-3 flex flex-col items-center gap-1 md:mb-2">
				<div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
					<span>상호 : 에이전트티</span>
					<span class="hidden md:inline">|</span>
					<span>대표 : 진민수</span>
					<span class="hidden md:inline">|</span>
					<span>E-mail : j@agentt.kr</span>
				</div>
			</div>
			
			<!-- Row 2: Address and Phone -->
			<div class="mb-3 flex flex-col items-center gap-1 md:mb-2">
				<div class="flex flex-col items-center gap-1 md:flex-row md:gap-4">
					<span>주소 : 경기도 화성시 메타폴리스로 42 9층</span>
					<span class="hidden md:inline">|</span>
					<span>전화 : 010-8200-4994 (독일 +49 174 4360256)</span>
				</div>
			</div>
			
			<!-- Row 3: Business Registration -->
			<div class="flex flex-col items-center gap-1">
				<div class="flex flex-col items-center gap-1 md:flex-row md:gap-4">
					<span>사업자등록번호 : 126-56-00745</span>
					<span class="hidden md:inline">|</span>
					<span>통신판매번호 : 2024-화성동탄-1329호</span>
				</div>
			</div>
		</div>
	</div>

	<p class="text-sm">© {currentYear} MatchTrip. All rights reserved.</p>
</footer>

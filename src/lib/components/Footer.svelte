<script lang="ts">
	import { ChevronDown, ChevronUp } from 'lucide-svelte';

	// Get current year for copyright
	const currentYear = new Date().getFullYear();

	// State for business info collapse
	let businessInfoOpen = $state(false);

	function toggleBusinessInfo() {
		businessInfoOpen = !businessInfoOpen;
	}
</script>

<footer class="mt-auto pt-8 pb-4 text-center text-sm text-gray-500">
	<div class="mx-auto max-w-md px-4">
		<div class="mb-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
			<a href="/terms/service" class="hover:text-gray-700 hover:underline">이용약관</a>
			<a href="/terms/privacy" class="hover:text-gray-700 hover:underline">개인정보처리방침</a>
			<a href="/terms/refund-policy" class="hover:text-gray-700 hover:underline">취소 및 환불 정책</a>
			<a href="/contact" class="hover:text-gray-700 hover:underline">앱 다운로드</a>
		</div>

		<!-- Business Info Section with Collapsible -->
		<div class="mb-4">
		<button
			onclick={toggleBusinessInfo}
			class="mx-auto mb-3 flex items-center justify-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-800"
		>
			<span>에이전트티 사업자 정보</span>
			{#if businessInfoOpen}
				<ChevronUp class="h-4 w-4 text-blue-500" />
			{:else}
				<ChevronDown class="h-4 w-4 text-blue-500" />
			{/if}
		</button>

		{#if businessInfoOpen}
			<div class="animate-in slide-in-from-top-2 space-y-1 break-keep text-xs text-gray-500 duration-200">
				<div>대표자 : 진민수 E-mail : j@agentt.kr</div>
				<div>전화 : 010-8200-4994 (독일 +49 174 4360256)</div>
				<div>주소 : 경기도 화성시 메타폴리스로 42 9층 901호 A13호 (반송동, 디앤씨빌딩)</div>
				<div>사업자등록번호 : 126-56-00745 통신판매번호 : 2024-화성동탄-1329호</div>
			</div>
		{/if}
		</div>

		<div class="mb-2 break-keep text-xs text-gray-400">
			매치트립은 통신판매중개자이며, 통신판매의 당사자가 아닙니다.<br />
			상품, 상품정보, 거래에 관한 의무와 책임은 판매회원에게 있습니다.
		</div>

		<p class="text-sm">© {currentYear} MatchTrip. All rights reserved.</p>
	</div>
</footer>

<style>
	@keyframes slide-in-from-top {
		from {
			transform: translateY(-0.5rem);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.animate-in {
		animation: slide-in-from-top 0.2s ease-out;
	}
</style>

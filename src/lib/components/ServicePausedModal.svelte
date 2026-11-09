<script lang="ts">
	let { isOpen, onclose }: { isOpen: boolean; onclose: () => void } = $props();
</script>

{#if isOpen}
	<div class="fixed inset-0 z-40 bg-black/50" onclick={onclose} aria-hidden="true"></div>

	<div class="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
		<div class="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
			<h2 class="mb-2 text-lg font-bold text-gray-900">서비스 일시 중단 안내</h2>
			<p class="mb-6 text-sm leading-relaxed text-gray-600">
				현재 매치트립 서비스 이용이 일시 중단되어 로그인할 수 없습니다.<br />
				이용에 불편을 드려 죄송합니다.
			</p>
			<button
				onclick={onclose}
				class="w-full rounded-xl bg-blue-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
			>
				확인
			</button>
		</div>
	</div>
{/if}

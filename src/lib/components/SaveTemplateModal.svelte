<script lang="ts">
	import { colors } from '$lib/constants/colors';

	interface Props {
		showModal: boolean;
		onclose: () => void;
		onsave: (title: string) => void;
		oncontinue: () => void;
	}

	let { showModal = $bindable(), onclose, onsave, oncontinue }: Props = $props();

	let templateTitle = $state('');
	let saving = $state(false);

	$effect(() => {
		if (showModal) {
			templateTitle = '';
			saving = false;
		}
	});

	async function handleSave() {
		if (!templateTitle.trim()) {
			alert('템플릿 이름을 입력해주세요');
			return;
		}

		saving = true;
		try {
			await onsave(templateTitle);
		} finally {
			saving = false;
		}
	}

	function handleContinue() {
		oncontinue();
	}
</script>

{#if showModal}
	<!-- Backdrop -->
	<div class="fixed inset-0 bg-black/50 z-40"></div>

	<!-- Modal -->
	<div class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 max-w-sm w-full mx-4 z-50">
		<div class="text-center mb-6">
			<h3 class="text-lg font-semibold mb-2">저장하기</h3>
			<p class="text-sm text-gray-600">
				작성하신 내용을 양식으로 저장하시겠습니까?
			</p>
		</div>

		{#if saving}
			<div class="flex justify-center py-4">
				<div class="w-6 h-6 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
			</div>
		{:else}
			<div class="space-y-4">
				<input
					type="text"
					bind:value={templateTitle}
					placeholder="템플릿 이름을 입력하세요"
					class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					maxlength="255"
				/>

				<div class="flex gap-3">
					<button
						onclick={handleContinue}
						class="flex-1 py-3 rounded-lg border border-gray-300 font-medium hover:bg-gray-50"
					>
						건너뛰기
					</button>
					<button
						onclick={handleSave}
						disabled={!templateTitle.trim()}
						class="flex-1 py-3 rounded-lg font-medium text-white transition-all
							{templateTitle.trim() 
								? 'hover:opacity-90' 
								: 'cursor-not-allowed opacity-50'}"
						style="background-color: {templateTitle.trim() ? colors.primary : '#CBD5E1'}"
					>
						저장하기
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
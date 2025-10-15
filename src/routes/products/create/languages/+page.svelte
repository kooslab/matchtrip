<script lang="ts">
	import { goto } from '$app/navigation';

	const { data } = $props();

	// Get product data from layout
	const productData = $derived(data.productData);

	// Available languages
	const availableLanguages = [
		{ code: 'ko', name: '한국어' },
		{ code: 'en', name: '영어' },
		{ code: 'ja', name: '일본어' },
		{ code: 'zh-CN', name: '중국어(간체)' },
		{ code: 'zh-TW', name: '중국어(번체)' },
		{ code: 'es', name: '스페인어' },
		{ code: 'fr', name: '프랑스어' },
		{ code: 'de', name: '독일어' },
		{ code: 'it', name: '이탈리아어' },
		{ code: 'pt', name: '포르투갈어' },
		{ code: 'ru', name: '러시아어' },
		{ code: 'ar', name: '아랍어' },
		{ code: 'hi', name: '힌디어' },
		{ code: 'th', name: '태국어' },
		{ code: 'vi', name: '베트남어' },
		{ code: 'id', name: '인도네시아어' },
		{ code: 'ms', name: '말레이어' },
		{ code: 'tr', name: '터키어' },
		{ code: 'nl', name: '네덜란드어' },
		{ code: 'sv', name: '스웨덴어' }
	];

	// Form state
	let selectedLanguages = $state(new Set(productData.languages || []));
	let isSubmitting = $state(false);

	// Toggle language selection
	function toggleLanguage(code: string) {
		if (selectedLanguages.has(code)) {
			selectedLanguages.delete(code);
		} else {
			selectedLanguages.add(code);
		}
		selectedLanguages = new Set(selectedLanguages); // Trigger reactivity
	}

	// Validate and submit
	async function handleSubmit() {
		if (selectedLanguages.size === 0) {
			window.alert('최소 하나의 언어를 선택해주세요');
			return;
		}

		isSubmitting = true;

		try {
			// Save to cookies
			await fetch('/api/products/create/save-step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					step: 'languages',
					data: {
						languages: Array.from(selectedLanguages)
					}
				})
			});

			// Navigate to next step
			await goto('/products/create/attachments');
		} catch (error) {
			console.error('Error saving languages:', error);
			window.alert('저장 중 오류가 발생했습니다');
			isSubmitting = false;
		}
	}
</script>

<div class="flex-1 bg-white">
	<!-- Title -->
	<div class="px-4 pt-6 pb-4">
		<h2 class="text-lg text-gray-600">사용 가능한 언어를 선택해주세요</h2>
		<p class="mt-2 text-sm text-gray-500">사용 가능한 언어를 나열해 주세요</p>
	</div>

	<!-- Languages List -->
	<div class="pb-20">
		<div class="divide-y divide-gray-100">
			{#each availableLanguages as language}
				<button
					onclick={() => toggleLanguage(language.code)}
					class="flex w-full items-center justify-between px-4 py-4 transition-colors hover:bg-gray-50"
				>
					<span class="text-gray-900 {selectedLanguages.has(language.code) ? 'font-medium' : ''}">
						{language.name}
					</span>
					<div class="flex items-center">
						{#if selectedLanguages.has(language.code)}
							<div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
								<svg
									class="h-4 w-4 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
						{:else}
							<div class="h-6 w-6 rounded-full border-2 border-gray-300"></div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</div>

	<!-- Submit Button -->
	<div class="fixed right-0 bottom-0 left-0 border-t bg-white p-4">
		<div class="mx-auto max-w-[430px]">
			<div class="mb-2 text-center text-sm text-gray-600">
				{selectedLanguages.size}개 언어 선택됨
			</div>
			<button
				onclick={handleSubmit}
				disabled={selectedLanguages.size === 0 || isSubmitting}
				class="w-full rounded-lg bg-blue-500 py-4 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300"
			>
				{isSubmitting ? '저장 중...' : '다음'}
			</button>
		</div>
	</div>
</div>

<script lang="ts">
	import { goto } from '$app/navigation';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	
	const { data } = $props();
	
	// Get product data from layout
	const productData = $derived(data.productData);
	
	// Form state
	let description = $state(productData.description || '');
	let isSubmitting = $state(false);
	let editorRef: RichTextEditor;
	
	// Handle content change
	function handleDescriptionChange(content: string) {
		description = content;
	}
	
	// Validate and submit
	async function handleSubmit() {
		if (!description.trim()) {
			window.alert('상품 설명을 입력해주세요');
			return;
		}
		
		isSubmitting = true;
		
		try {
			// Save to cookies
			await fetch('/api/products/create/save-step', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					step: 'description',
					data: { description }
				})
			});
			
			// Navigate to next step
			goto('/products/create/duration');
		} catch (error) {
			console.error('Error saving description:', error);
			window.alert('저장 중 오류가 발생했습니다');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="flex-1 bg-white p-4">
	<!-- Title -->
	<div class="mb-6">
		<h2 class="text-lg text-gray-600">상품 내용을 편하게 작성해 주세요</h2>
		<p class="mt-2 text-sm text-gray-500">
			여행 일정과 구체적으로 무엇을 작성해주세요.
		</p>
	</div>
	
	<!-- Description Editor -->
	<div class="mb-20">
		<RichTextEditor
			bind:this={editorRef}
			value={description}
			onchange={handleDescriptionChange}
			placeholder="상품 내용을 자유롭게 작성해주세요.

예시:
오전 9:00 - 호텔 픽업
오전 10:00 - 첫 번째 관광지 방문
오후 12:00 - 현지 맛집에서 점심 식사
오후 2:00 - 문화 체험 활동
오후 5:00 - 호텔 복귀"
			minHeight="400px"
			showImageButton={true}
			showHelperText={true}
			helperTitle="작성 팁"
			helperItems={[
				'• 시간대별로 구체적인 일정을 작성해주세요',
				'• 포함/불포함 사항을 명확히 기재해주세요',
				'• 이미지를 추가하면 상품의 매력도가 높아집니다',
				'• 텍스트 중간에 이미지를 추가하려면 원하는 위치에 커서를 놓고 카메라 버튼을 클릭하세요'
			]}
		/>
	</div>
	
	<!-- Submit Button -->
	<div class="fixed bottom-0 left-0 right-0 bg-white p-4 border-t">
		<div class="mx-auto max-w-[430px]">
			<button
				onclick={handleSubmit}
				disabled={!description.trim() || isSubmitting}
				class="w-full rounded-lg bg-blue-500 py-4 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
			>
				{isSubmitting ? '저장 중...' : '다음'}
			</button>
		</div>
	</div>
</div>
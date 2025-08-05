<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let tripId = $derived($page.url.searchParams.get('tripId'));
	let editorRef: RichTextEditor;

	// Store content as HTML for rich text with images
	let itineraryContent = $state('');
	let isInitialLoad = true;

	// Load existing data if any
	$effect(() => {
		const currentItinerary = $offerFormStore.itinerary;
		if (
			currentItinerary &&
			currentItinerary[0] &&
			currentItinerary[0].timeSlots[0] &&
			isInitialLoad &&
			editorRef
		) {
			// Load existing content
			const existingContent = currentItinerary[0].timeSlots[0].title;
			if (existingContent) {
				editorRef.setContent(existingContent);
				itineraryContent = existingContent;
				isInitialLoad = false;
			}
		}
	});

	// Handle content change
	function handleItineraryChange(content: string) {
		itineraryContent = content;
		updateStore();
	}

	// Store update
	function updateStore() {
		if (itineraryContent) {
			offerFormStore.updateItineraryDay(0, {
				day: 1,
				imageUrl: '', // Not used anymore since images are inline
				timeSlots: [
					{
						time: '',
						title: itineraryContent, // Store HTML content
						description: ''
					}
				]
			});
		}
	}

	function handleNext() {
		// Save final content before navigating
		updateStore();
		goto(`/offers/create/files?tripId=${tripId}`);
	}
</script>

<div class="flex-1 px-4 py-6 pb-20">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">여행 일정을 입력해 주세요</h2>
			<p class="mt-2 text-sm text-gray-500">
				구체적인 일정을 작성하면 여행자의 선택 확률이 높아집니다.
			</p>
		</div>

		<!-- Rich Text Editor -->
		<RichTextEditor
			bind:this={editorRef}
			value={itineraryContent}
			onchange={handleItineraryChange}
			placeholder="여행 일정을 자유롭게 작성해주세요.

예시:
오전 9:00 - 호텔에서 출발
오전 10:00 - 남산타워 도착 및 관람
오후 12:00 - 명동에서 점심 식사
오후 2:00 - 북촌 한옥마을 투어
오후 4:00 - 인사동 전통찻집 방문
오후 6:00 - 호텔 복귀"
			minHeight="300px"
			showImageButton={true}
			showHelperText={true}
			helperTitle="작성 팁"
			helperItems={[
				'• 시간대별로 구체적인 일정을 작성해주세요',
				'• 이동 수단과 소요 시간을 포함하면 좋습니다',
				'• 텍스트 중간에 이미지를 추가하려면 원하는 위치에 커서를 놓고 카메라 버튼을 클릭하세요'
			]}
		/>
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<div class="px-4 py-4 pb-4">
		<button
			onclick={handleNext}
			class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
			style="background-color: {colors.primary}"
			type="button"
		>
			다음
		</button>
	</div>
</div>

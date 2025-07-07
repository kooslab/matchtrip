<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore, offerFormValidation } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';

	let tripId = $derived($page.url.searchParams.get('tripId'));

	// Bind to store value
	let description = $state($offerFormStore.description);

	// Update store when value changes
	$effect(() => {
		offerFormStore.setDescription(description);
	});

	function handleNext() {
		if ($offerFormValidation.isDescriptionValid) {
			goto(`/offers/create/itinerary?tripId=${tripId}`);
		}
	}

	// Character count
	const charCount = $derived(description.length);
	const maxChars = 1000;
</script>

<div class="flex-1 px-4 py-6 pb-40">
	<div class="space-y-6">
		<!-- Title -->
		<div>
			<h2 class="text-lg font-medium text-gray-800">제안 내용을 편하게 작성해 주세요</h2>
			<p class="mt-2 text-sm text-gray-500">
				여행자에게 어필할 수 있는 매력적인 제안을 작성해주세요.
			</p>
		</div>

		<!-- Description Textarea -->
		<div class="space-y-2">
			<label for="description" class="block text-sm font-medium text-gray-700"> 제안 내용 </label>
			<div class="relative">
				<textarea
					id="description"
					bind:value={description}
					placeholder="제안 내용을 작성해주세요"
					rows="8"
					maxlength={maxChars}
					class="focus:border-opacity-100 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-base placeholder-gray-400 transition-colors focus:ring-1 focus:outline-none"
					style="--tw-ring-color: {colors.primary}; --tw-border-opacity: 1;"
					onfocus={(e) => (e.currentTarget.style.borderColor = colors.primary)}
					onblur={(e) => (e.currentTarget.style.borderColor = '')}
				></textarea>
			</div>

			<!-- Character count -->
			<div class="flex justify-between text-xs">
				<p class="text-gray-500">
					여행 일정을 구체적으로 작성해주세요.<br />
					시간, 장소, 활동 등을 포함하면 더 좋습니다.
				</p>
				<span class="text-gray-500">{charCount}/{maxChars}</span>
			</div>
		</div>

		<!-- Writing Tips -->
		<div class="rounded-lg bg-blue-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-blue-900">작성 가이드</h3>
			<ul class="space-y-1 text-sm text-blue-800">
				<li>• 여행자의 관심사와 목적에 맞춘 제안을 작성하세요</li>
				<li>• 구체적인 장소와 활동을 포함하면 신뢰도가 높아집니다</li>
				<li>• 본인만의 특별한 경험이나 노하우를 어필하세요</li>
				<li>• 포함/불포함 사항을 명확히 구분해주세요</li>
			</ul>
		</div>

		<!-- Example Template -->
		<details class="rounded-lg border border-gray-200 bg-white">
			<summary class="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700">
				예시 템플릿 보기
			</summary>
			<div class="border-t border-gray-200 p-4">
				<p class="text-sm text-gray-600">
					안녕하세요! [여행지]를 사랑하는 현지 가이드 [이름]입니다.<br /><br />

					[여행자님의 관심사]에 맞춰 특별한 여행을 준비했습니다.<br /><br />

					<strong>주요 일정:</strong><br />
					• 첫째 날: [주요 명소] 방문 및 [특별 활동]<br />
					• 둘째 날: [숨은 명소] 탐방 및 [현지 체험]<br /><br />

					<strong>포함 사항:</strong><br />
					• 전 일정 가이드 동행<br />
					• 차량 및 기사<br />
					• 입장료<br /><br />

					<strong>불포함 사항:</strong><br />
					• 식사비<br />
					• 개인 경비<br /><br />

					[특별한 경험이나 차별점]<br />
					편안하고 즐거운 여행이 되도록 최선을 다하겠습니다!
				</p>
			</div>
		</details>
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed right-0 bottom-20 left-0 bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<button
		onclick={handleNext}
		disabled={!$offerFormValidation.isDescriptionValid}
		class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all
			{$offerFormValidation.isDescriptionValid ? 'hover:opacity-90' : 'cursor-not-allowed opacity-50'}"
		style="background-color: {$offerFormValidation.isDescriptionValid ? colors.primary : '#CBD5E1'}"
	>
		다음
	</button>
</div>

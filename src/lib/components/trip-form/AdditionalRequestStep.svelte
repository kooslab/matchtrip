<script lang="ts">
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}

	let { formData, onUpdate }: Props = $props();

	// Local state - check both customRequest and additionalRequest fields
	let additionalRequest = $state(formData.customRequest || formData.additionalRequest || '');
	let isGeneratingAI = $state(false);
	let showConfirmDialog = $state(false);
	let generatedContent = $state('');

	// Update parent when text changes
	function handleInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		additionalRequest = target.value;
		onUpdate('customRequest', additionalRequest);
		onUpdate('additionalRequest', additionalRequest);
	}

	// Generate AI request
	async function generateAIRequest() {
		isGeneratingAI = true;
		
		try {
			const response = await fetch('/api/ai/generate-trip-request', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					destination: formData.destination,
					destinationId: formData.destinationId,
					startDate: formData.startDate,
					endDate: formData.endDate,
					adultsCount: formData.adultsCount,
					childrenCount: formData.childrenCount,
					babiesCount: formData.babiesCount,
					budget: formData.budget,
					travelStyle: formData.travelStyle,
					activities: formData.activities,
					customRequest: formData.customRequest,
					additionalRequest: formData.additionalRequest
				})
			});

			if (!response.ok) {
				throw new Error('Failed to generate AI request');
			}

			const data = await response.json();
			generatedContent = data.request;
			showConfirmDialog = true;
		} catch (error) {
			console.error('Error generating AI request:', error);
			alert('AI 요청 생성에 실패했습니다. 다시 시도해주세요.');
		} finally {
			isGeneratingAI = false;
		}
	}

	// Confirm generated content
	function confirmGenerated() {
		additionalRequest = generatedContent;
		onUpdate('customRequest', additionalRequest);
		onUpdate('additionalRequest', additionalRequest);
		showConfirmDialog = false;
		generatedContent = '';
	}

	// Cancel generated content
	function cancelGenerated() {
		showConfirmDialog = false;
		generatedContent = '';
	}

	// Regenerate content
	async function regenerateContent() {
		showConfirmDialog = false;
		generatedContent = '';
		await generateAIRequest();
	}

	// Update local state when formData changes
	$effect(() => {
		const newValue = formData.customRequest || formData.additionalRequest || '';
		if (newValue !== additionalRequest) {
			additionalRequest = newValue;
		}
	});

	// Validation
	export function validate() {
		// Optional field, always valid
		return true;
	}
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">추가 요청사항</h1>
		<p class="mt-2 text-gray-600">여행에 대한 특별한 요청사항이 있으신가요?</p>
	</div>

	<div class="px-4 pb-6">
		<label class="mb-2 block text-xs font-medium text-gray-700">요청사항 (선택)</label>
		<textarea
			value={additionalRequest}
			oninput={handleInput}
			placeholder="예: 특별한 음식 제한, 접근성 요구사항, 특정 장소 방문 희망 등"
			class="min-h-[250px] w-full resize-y rounded-lg border border-gray-300 p-4 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
		/>
		<p class="mt-2 text-xs text-gray-500">
			{additionalRequest.length}/500자
		</p>
		
		<!-- AI Button -->
		<button
			onclick={generateAIRequest}
			disabled={isGeneratingAI}
			class="mt-4 w-full rounded-lg bg-blue-500 py-3 px-4 font-medium text-white transition-colors hover:bg-blue-600 disabled:bg-blue-400 disabled:cursor-not-allowed"
		>
			{isGeneratingAI ? 'AI 여행요청 생성 중...' : 'AI 일정 만들기'}
		</button>
	</div>
</div>

<!-- Confirmation Dialog -->
{#if showConfirmDialog}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
		<div class="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-bold text-gray-900">AI가 생성한 여행 요청사항</h3>
			
			<div class="mb-6 max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4">
				<p class="whitespace-pre-wrap text-sm text-gray-700">{generatedContent}</p>
			</div>
			
			<div class="flex gap-3">
				<button
					onclick={confirmGenerated}
					class="flex-1 rounded-lg bg-blue-500 py-2.5 px-4 font-medium text-white transition-colors hover:bg-blue-600"
				>
					확인
				</button>
				<button
					onclick={regenerateContent}
					disabled={isGeneratingAI}
					class="flex-1 rounded-lg bg-green-500 py-2.5 px-4 font-medium text-white transition-colors hover:bg-green-600 disabled:bg-green-400 disabled:cursor-not-allowed"
				>
					{isGeneratingAI ? '생성 중...' : '다시 생성'}
				</button>
				<button
					onclick={cancelGenerated}
					class="flex-1 rounded-lg bg-gray-300 py-2.5 px-4 font-medium text-gray-700 transition-colors hover:bg-gray-400"
				>
					취소
				</button>
			</div>
		</div>
	</div>
{/if}

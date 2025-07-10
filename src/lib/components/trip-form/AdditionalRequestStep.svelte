<script lang="ts">
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}
	
	let { formData, onUpdate }: Props = $props();
	
	// Local state
	let additionalRequest = $state(formData.additionalRequest || '');
	
	// Update parent when text changes
	$effect(() => {
		onUpdate('additionalRequest', additionalRequest);
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
		<label class="block text-xs font-medium text-gray-700 mb-2">요청사항 (선택)</label>
		<textarea
			bind:value={additionalRequest}
			placeholder="예: 특별한 음식 제한, 접근성 요구사항, 특정 장소 방문 희망 등"
			class="w-full min-h-[150px] p-4 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
		/>
		<p class="mt-2 text-xs text-gray-500">
			{additionalRequest.length}/500자
		</p>
	</div>
</div>
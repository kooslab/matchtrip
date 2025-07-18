<script lang="ts">
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}

	let { formData, onUpdate }: Props = $props();

	// Local state
	let selectedActivities = $state(formData.activities || []);

	// Activity options
	const activityOptions = [
		{ id: 'city-tour', name: '시내투어', icon: '🏙️' },
		{ id: 'suburb-tour', name: '근교투어', icon: '🌲' },
		{ id: 'snap-photo', name: '스냅사진', icon: '📸' },
		{ id: 'vehicle-tour', name: '차량투어', icon: '🚗' },
		{ id: 'airport-pickup', name: '공항픽업', icon: '✈️' },
		{ id: 'bus-charter', name: '버스대절', icon: '🚌' },
		{ id: 'interpretation', name: '통역 서비스', icon: '🗣️' },
		{ id: 'accommodation', name: '숙박(민박)', icon: '🏠' },
		{ id: 'organization-visit', name: '기관방문', icon: '🏢' },
		{ id: 'other-tour', name: '기타투어', icon: '🎯' }
	];

	// Toggle activity selection
	function toggleActivity(id: string) {
		if (selectedActivities.includes(id)) {
			selectedActivities = selectedActivities.filter((a: string) => a !== id);
		} else {
			if (selectedActivities.length >= 3) {
				alert('최대 3개까지 선택 가능합니다.');
				return;
			}
			selectedActivities = [...selectedActivities, id];
		}
		onUpdate('activities', selectedActivities);
	}

	// Validation
	export function validate() {
		if (selectedActivities.length === 0) {
			alert('관심 활동을 하나 이상 선택해주세요.');
			return false;
		}
		return true;
	}
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">관심 활동</h1>
		<p class="mt-2 text-gray-600">여행 중 어떤 활동을 원하시나요? (최대 3개)</p>
		{#if selectedActivities.length > 0}
			<p class="mt-1 text-sm text-blue-600">{selectedActivities.length}/3개 선택됨</p>
		{/if}
	</div>

	<div class="px-4 pb-6">
		<div class="grid grid-cols-2 gap-3">
			{#each activityOptions as activity}
				<button
					onclick={() => toggleActivity(activity.id)}
					disabled={selectedActivities.length >= 3 && !selectedActivities.includes(activity.id)}
					class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all {selectedActivities.includes(
						activity.id
					)
						? 'border-blue-600 bg-blue-50'
						: selectedActivities.length >= 3
							? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
							: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
				>
					<span class="text-2xl">{activity.icon}</span>
					<span
						class="text-center text-sm font-medium {selectedActivities.includes(activity.id)
							? 'text-blue-600'
							: 'text-gray-900'}"
					>
						{activity.name}
					</span>
					{#if selectedActivities.includes(activity.id)}
						<div class="absolute top-2 right-2">
							<svg
								class="h-5 w-5 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>

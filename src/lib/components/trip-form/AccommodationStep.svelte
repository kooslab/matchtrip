<script lang="ts">
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}
	
	let { formData, onUpdate }: Props = $props();
	
	// Local state
	let selectedAccommodations = $state(formData.accommodations || []);
	
	// Accommodation options
	const accommodationOptions = [
		{ id: 'hotel', name: '호텔', icon: '🏨' },
		{ id: 'resort', name: '리조트', icon: '🏖️' },
		{ id: 'guesthouse', name: '게스트하우스', icon: '🏠' },
		{ id: 'airbnb', name: '에어비앤비', icon: '🏡' },
		{ id: 'hostel', name: '호스텔', icon: '🛏️' },
		{ id: 'pension', name: '펜션', icon: '🏘️' },
		{ id: 'camping', name: '캠핑', icon: '⛺' },
		{ id: 'hanok', name: '한옥', icon: '🏯' }
	];
	
	// Toggle accommodation selection
	function toggleAccommodation(id: string) {
		if (selectedAccommodations.includes(id)) {
			selectedAccommodations = selectedAccommodations.filter(acc => acc !== id);
		} else {
			selectedAccommodations = [...selectedAccommodations, id];
		}
		onUpdate('accommodations', selectedAccommodations);
	}
	
	// Validation
	export function validate() {
		if (selectedAccommodations.length === 0) {
			alert('최소 1개 이상의 숙박 유형을 선택해주세요.');
			return false;
		}
		return true;
	}
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">선호하는 숙박</h1>
		<p class="mt-2 text-gray-600">원하시는 숙박 유형을 모두 선택해주세요</p>
	</div>
	
	<div class="px-4 pb-6">
		<div class="grid grid-cols-2 gap-3">
			{#each accommodationOptions as option}
				<button
					onclick={() => toggleAccommodation(option.id)}
					class="flex flex-col items-center justify-center rounded-xl p-4 transition-all {
						selectedAccommodations.includes(option.id)
							? 'bg-blue-50 border-2 border-blue-500'
							: 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
					}"
				>
					<span class="text-2xl mb-2">{option.icon}</span>
					<span class="text-sm font-medium {
						selectedAccommodations.includes(option.id)
							? 'text-blue-600'
							: 'text-gray-700'
					}">
						{option.name}
					</span>
				</button>
			{/each}
		</div>
		
		{#if selectedAccommodations.length > 0}
			<div class="mt-4 rounded-lg bg-blue-50 p-3">
				<p class="text-sm text-blue-600">
					{selectedAccommodations.length}개 선택됨
				</p>
			</div>
		{/if}
	</div>
</div>
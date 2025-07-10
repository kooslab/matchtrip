<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';
	
	let { data } = $props();
	let trip = $derived(data.trip);
	
	// Accommodation types
	const accommodationTypes = [
		{ value: 'hotel', label: '호텔', icon: '🏨' },
		{ value: 'resort', label: '리조트', icon: '🏖️' },
		{ value: 'guesthouse', label: '게스트하우스', icon: '🏠' },
		{ value: 'hostel', label: '호스텔', icon: '🛏️' },
		{ value: 'airbnb', label: '에어비앤비', icon: '🏡' },
		{ value: 'traditional', label: '전통 숙소', icon: '🏯' },
		{ value: 'camping', label: '캠핑', icon: '⛺' },
		{ value: 'no_preference', label: '상관없음', icon: '🤷' }
	];
	
	// Form state
	let selectedType = $state('');
	let preferences = $state('');
	
	// Initialize form on mount
	onMount(() => {
		const formData = tripEditForm.getData();
		selectedType = formData.accommodationType || trip.accommodationType || '';
		preferences = formData.accommodationPreferences || trip.accommodationPreferences || '';
	});
	
	// Navigation
	function handleNext() {
		if (!selectedType) {
			alert('숙박 유형을 선택해주세요.');
			return;
		}
		
		tripEditForm.updateStep('accommodationType', selectedType);
		tripEditForm.updateStep('accommodationPreferences', preferences);
		goto(`/my-trips/${trip.id}/edit/activities`);
	}
	
	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/transportation`);
	}
	
	function selectType(value: string) {
		selectedType = value;
	}
</script>

<div class="px-4 py-6">
	<div class="rounded-lg bg-white p-4">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">어떤 숙소를 선호하시나요?</h2>
		
		<!-- Accommodation type grid -->
		<div class="grid grid-cols-2 gap-3">
			{#each accommodationTypes as type}
				<button
					onclick={() => selectType(type.value)}
					class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all {
						selectedType === type.value
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:border-gray-300'
					}"
				>
					<span class="text-2xl">{type.icon}</span>
					<span class="text-sm font-medium {
						selectedType === type.value ? 'text-blue-900' : 'text-gray-700'
					}">
						{type.label}
					</span>
				</button>
			{/each}
		</div>
		
		<!-- Additional preferences -->
		<div class="mt-4">
			<label class="mb-2 block text-sm font-medium text-gray-700">
				추가 요청사항 (선택)
			</label>
			<textarea
				bind:value={preferences}
				rows="3"
				placeholder="예: 조용한 곳, 시내 중심가, 수영장 있는 곳..."
				class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
			></textarea>
		</div>
		
		<!-- Selected type display -->
		{#if selectedType}
			{@const selected = accommodationTypes.find(t => t.value === selectedType)}
			{#if selected}
				<div class="mt-4 rounded-lg bg-blue-50 p-3">
					<p class="text-sm text-blue-600">선택된 숙박 유형</p>
					<p class="flex items-center gap-2 font-medium text-blue-900">
						<span>{selected.icon}</span>
						{selected.label}
					</p>
					{#if preferences}
						<p class="mt-1 text-sm text-blue-700">{preferences}</p>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
	
	<!-- Action buttons -->
	<div class="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-gray-200 bg-white p-4 pb-24">
		<button
			onclick={handleBack}
			class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
		>
			이전
		</button>
		<button
			onclick={handleNext}
			class="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
		>
			다음
		</button>
	</div>
</div>
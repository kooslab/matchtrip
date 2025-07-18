<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Travel style options
	const travelStyles = [
		{ value: 'relaxation', label: '휴양/힐링', icon: '🏖️' },
		{ value: 'adventure', label: '모험/액티비티', icon: '🏔️' },
		{ value: 'culture', label: '문화/역사', icon: '🏛️' },
		{ value: 'food', label: '미식/요리', icon: '🍽️' },
		{ value: 'shopping', label: '쇼핑', icon: '🛍️' },
		{ value: 'nature', label: '자연/생태', icon: '🌿' },
		{ value: 'city', label: '도시 탐방', icon: '🏙️' },
		{ value: 'family', label: '가족 여행', icon: '👨‍👩‍👧‍👦' }
	];

	// Form state
	let selectedStyle = $state('');

	// Initialize form on mount
	onMount(() => {
		const formData = tripEditForm.getData();
		selectedStyle = formData.tourType || trip.tourType || '';
	});

	// Navigation
	function handleNext() {
		if (!selectedStyle) {
			alert('여행 스타일을 선택해주세요.');
			return;
		}

		tripEditForm.updateStep('tourType', selectedStyle);
		goto(`/my-trips/${trip.id}/edit/budget`);
	}

	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/travelers`);
	}

	function selectStyle(value: string) {
		selectedStyle = value;
	}
</script>

<div class="px-4 py-6">
	<div class="rounded-lg bg-white p-4">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">어떤 스타일의 여행을 원하시나요?</h2>

		<!-- Travel style grid -->
		<div class="grid grid-cols-2 gap-3">
			{#each travelStyles as style}
				<button
					onclick={() => selectStyle(style.value)}
					class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all {selectedStyle ===
					style.value
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300'}"
				>
					<span class="text-2xl">{style.icon}</span>
					<span
						class="text-sm font-medium {selectedStyle === style.value
							? 'text-blue-900'
							: 'text-gray-700'}"
					>
						{style.label}
					</span>
				</button>
			{/each}
		</div>

		<!-- Selected style display -->
		{#if selectedStyle}
			{@const selected = travelStyles.find((s) => s.value === selectedStyle)}
			{#if selected}
				<div class="mt-4 rounded-lg bg-blue-50 p-3">
					<p class="text-sm text-blue-600">선택된 여행 스타일</p>
					<p class="flex items-center gap-2 font-medium text-blue-900">
						<span>{selected.icon}</span>
						{selected.label}
					</p>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Action buttons -->
	<div class="fixed right-0 bottom-0 left-0 flex gap-3 border-t border-gray-200 bg-white p-4 pb-24">
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

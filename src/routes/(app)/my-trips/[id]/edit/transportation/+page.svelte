<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Transportation options
	const transportOptions = [
		{ value: 'walking', label: '도보', icon: '🚶' },
		{ value: 'public_transport', label: '대중교통', icon: '🚌' },
		{ value: 'driving', label: '자동차', icon: '🚗' },
		{ value: 'bike', label: '자전거', icon: '🚴' }
	];

	// Form state
	let selectedMethods = $state<string[]>([]);
	let needsDriver = $state(false);

	// Initialize form on mount
	onMount(() => {
		const formData = tripEditForm.getData();
		needsDriver = formData.needsDriver || trip.needsDriver || false;

		// Parse travel method
		const method = formData.travelMethod || trip.travelMethod || '';
		if (method) {
			selectedMethods = method.split('+');
		}
	});

	// Toggle transportation method
	function toggleMethod(value: string) {
		if (selectedMethods.includes(value)) {
			selectedMethods = selectedMethods.filter((m) => m !== value);
		} else {
			selectedMethods = [...selectedMethods, value];
		}
	}

	// Check if driving is selected
	let isDrivingSelected = $derived(selectedMethods.includes('driving'));

	// Build travel method string
	let travelMethod = $derived(selectedMethods.join('+'));

	// Navigation
	function handleNext() {
		if (selectedMethods.length === 0) {
			alert('교통수단을 하나 이상 선택해주세요.');
			return;
		}

		tripEditForm.updateStep('travelMethod', travelMethod);
		tripEditForm.updateStep('needsDriver', needsDriver);
		goto(`/my-trips/${trip.id}/edit/accommodation`);
	}

	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/budget`);
	}
</script>

<div class="px-4 py-6">
	<div class="rounded-lg bg-white p-4">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">어떻게 이동하실 예정인가요?</h2>
		<p class="mb-4 text-sm text-gray-600">여러 개를 선택할 수 있어요</p>

		<!-- Transportation options -->
		<div class="grid grid-cols-2 gap-3">
			{#each transportOptions as option}
				<button
					onclick={() => toggleMethod(option.value)}
					class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all {selectedMethods.includes(
						option.value
					)
						? 'border-blue-500 bg-blue-50'
						: 'border-gray-200 hover:border-gray-300'}"
				>
					<span class="text-2xl">{option.icon}</span>
					<span
						class="text-sm font-medium {selectedMethods.includes(option.value)
							? 'text-blue-900'
							: 'text-gray-700'}"
					>
						{option.label}
					</span>
				</button>
			{/each}
		</div>

		<!-- Driver option (only show if driving is selected) -->
		{#if isDrivingSelected}
			<div class="mt-4 rounded-lg border border-gray-200 p-4">
				<label class="flex items-center justify-between">
					<div>
						<p class="font-medium text-gray-900">운전기사 필요</p>
						<p class="text-sm text-gray-500">가이드가 운전도 해주길 원하시나요?</p>
					</div>
					<input
						type="checkbox"
						bind:checked={needsDriver}
						class="h-5 w-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
					/>
				</label>
			</div>
		{/if}

		<!-- Selected methods display -->
		{#if selectedMethods.length > 0}
			<div class="mt-4 rounded-lg bg-blue-50 p-3">
				<p class="text-sm text-blue-600">선택된 교통수단</p>
				<p class="font-medium text-blue-900">
					{selectedMethods
						.map((m) => transportOptions.find((o) => o.value === m)?.label)
						.join(' + ')}
					{#if needsDriver}
						(운전기사 포함)
					{/if}
				</p>
			</div>
		{/if}
	</div>

	<!-- Action buttons -->
	<div class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white pb-24">
		<div class="mx-auto max-w-[430px] flex gap-3 p-4">
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
</div>

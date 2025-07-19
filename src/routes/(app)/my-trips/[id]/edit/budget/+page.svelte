<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Form state
	let minBudget = $state(200);
	let maxBudget = $state(500);
	let budgetType = $state('range'); // 'range' or 'flexible'

	// Common budget ranges
	const budgetRanges = [
		{ min: 100, max: 200, label: '100-200만원' },
		{ min: 200, max: 300, label: '200-300만원' },
		{ min: 300, max: 500, label: '300-500만원' },
		{ min: 500, max: 700, label: '500-700만원' },
		{ min: 700, max: 1000, label: '700-1000만원' },
		{ min: 1000, max: 9999, label: '1000만원 이상' }
	];

	// Initialize form on mount
	onMount(() => {
		const formData = tripEditForm.getData();
		minBudget = formData.minBudget || trip.minBudget || 200;
		maxBudget = formData.maxBudget || trip.maxBudget || 500;

		// Check if budget is flexible (min and max are same or not set)
		if (!formData.minBudget && !trip.minBudget) {
			budgetType = 'flexible';
		}
	});

	// Quick select budget range
	function selectBudgetRange(range: { min: number; max: number }) {
		minBudget = range.min;
		maxBudget = range.max;
		budgetType = 'range';
	}

	// Toggle flexible budget
	function toggleFlexible() {
		budgetType = budgetType === 'flexible' ? 'range' : 'flexible';
	}

	// Ensure max is greater than min
	$effect(() => {
		if (maxBudget < minBudget) {
			maxBudget = minBudget;
		}
	});

	// Navigation
	function handleNext() {
		if (budgetType === 'range') {
			tripEditForm.updateStep('minBudget', minBudget);
			tripEditForm.updateStep('maxBudget', maxBudget);
		} else {
			tripEditForm.updateStep('minBudget', null);
			tripEditForm.updateStep('maxBudget', null);
		}

		goto(`/my-trips/${trip.id}/edit/transportation`);
	}

	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/travel-style`);
	}
</script>

<div class="px-4 py-6">
	<div class="rounded-lg bg-white p-4">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">예산은 어느 정도 생각하시나요?</h2>

		<!-- Budget type toggle -->
		<div class="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
			<span class="text-sm font-medium text-gray-700">예산 미정</span>
			<button
				onclick={toggleFlexible}
				class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {budgetType ===
				'flexible'
					? 'bg-blue-500'
					: 'bg-gray-300'}"
			>
				<span
					class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {budgetType ===
					'flexible'
						? 'translate-x-6'
						: 'translate-x-1'}"
				></span>
			</button>
		</div>

		{#if budgetType === 'range'}
			<!-- Quick select buttons -->
			<div class="mb-4 grid grid-cols-2 gap-2">
				{#each budgetRanges as range}
					<button
						onclick={() => selectBudgetRange(range)}
						class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors {minBudget ===
							range.min && maxBudget === range.max
							? 'border-blue-500 bg-blue-50 text-blue-700'
							: 'border-gray-300 text-gray-700 hover:bg-gray-50'}"
					>
						{range.label}
					</button>
				{/each}
			</div>

			<!-- Custom range inputs -->
			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-sm text-gray-600">최소 예산 (만원)</label>
					<input
						type="number"
						bind:value={minBudget}
						min="0"
						max="10000"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label class="mb-1 block text-sm text-gray-600">최대 예산 (만원)</label>
					<input
						type="number"
						bind:value={maxBudget}
						min={minBudget}
						max="10000"
						class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Selected budget display -->
			<div class="mt-4 rounded-lg bg-blue-50 p-3">
				<p class="text-sm text-blue-600">설정된 예산</p>
				<p class="font-medium text-blue-900">
					{minBudget.toLocaleString()}-{maxBudget.toLocaleString()}만원
				</p>
			</div>
		{:else}
			<!-- Flexible budget message -->
			<div class="rounded-lg bg-amber-50 p-4">
				<p class="text-sm text-amber-800">
					예산을 정하지 않으셨네요. 가이드가 다양한 가격대의 제안을 보내드릴 거예요.
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

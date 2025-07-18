<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';
	import DestinationStep from '$lib/components/trip-form/DestinationStep.svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	let destinationStep: DestinationStep;
	let formData = $state({});

	// Initialize form on mount
	onMount(() => {
		tripEditForm.initializeFromTrip(trip);
		formData = tripEditForm.getData();
	});

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripEditForm.updateStep(field, value);
		formData = tripEditForm.getData();
	}

	// Navigation
	function handleNext() {
		if (destinationStep.validate()) {
			goto(`/my-trips/${trip.id}/edit/dates`);
		}
	}

	function handleCancel() {
		goto(`/my-trips/${trip.id}`);
	}
</script>

<div class="px-4 py-6">
	{#if formData.destination !== undefined}
		<DestinationStep bind:this={destinationStep} {formData} onUpdate={handleUpdate} />
	{/if}

	<!-- Action buttons -->
	<div class="fixed right-0 bottom-0 left-0 flex gap-3 border-t border-gray-200 bg-white p-4 pb-24">
		<button
			onclick={handleCancel}
			class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
		>
			취소
		</button>
		<button
			onclick={handleNext}
			class="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
		>
			다음
		</button>
	</div>
</div>

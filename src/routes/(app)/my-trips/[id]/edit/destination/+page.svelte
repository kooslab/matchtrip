<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';
	import DestinationServerStep from '$lib/components/trip-form/DestinationServerStep.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let trip = $derived(data.trip);

	let destinationStep: any;
	
	// Subscribe to store and make it reactive
	let storeData = $state({});
	const unsubscribe = tripEditForm.subscribe(value => {
		storeData = value;
	});
	
	// Use reactive formData that updates when store changes
	let formData = $derived(storeData);

	// Initialize form data from trip on mount
	onMount(() => {
		// Always initialize from trip data on first load
		const currentData = tripEditForm.getData();
		if (!currentData.destinationId || Object.keys(currentData).length === 0) {
			console.log('[Destination Page] Initializing form from trip:', trip);
			tripEditForm.initializeFromTrip(trip);
		}
		
		return () => {
			unsubscribe();
		};
	});

	// Auto-expand the section containing the selected destination
	$effect(() => {
		if (formData.destinationId && destinationStep && data.destinations) {
			// Find which country contains the selected destination
			for (const [country, dests] of Object.entries(data.destinations)) {
				if (dests.find((d: any) => d.id === formData.destinationId)) {
					destinationStep.expandSection(country);
					break;
				}
			}
		}
	});

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripEditForm.updateStep(field, value);
	}

	// Navigation
	function handleNext() {
		if (destinationStep.validate()) {
			goto(`/my-trips/${trip.id}/edit/dates`);
		}
	}

	// Get button text
	let buttonText = $derived(
		formData.destination && typeof formData.destination === 'object'
			? `${formData.destination.city}, ${formData.destination.country} 여행하기`
			: formData.destination && typeof formData.destination === 'string'
			? `${formData.destination} 여행하기`
			: '다음'
	);
</script>

<div class="flex-1 overflow-y-auto pb-32">
	{#if formData.destination !== undefined}
		<DestinationServerStep
			bind:this={destinationStep}
			{formData}
			onUpdate={handleUpdate}
			destinations={data.destinations}
		/>
	{/if}
</div>

<!-- Custom action button for destination -->
<div class="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
	<div class="mx-auto max-w-[430px] p-4">
		<button
			onclick={handleNext}
			disabled={!formData.destination}
			class="w-full rounded-lg py-3 font-medium transition-colors {formData.destination
				? 'bg-blue-500 text-white hover:bg-blue-600'
				: 'cursor-not-allowed bg-gray-200 text-gray-400'}"
		>
			{buttonText}
		</button>
	</div>
</div>

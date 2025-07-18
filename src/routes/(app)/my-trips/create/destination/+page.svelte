<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import DestinationServerStep from '$lib/components/trip-form/DestinationServerStep.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let destinationStep: any;
	let formData = $state(tripCreateForm.getData());

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}

	// Navigation
	function handleNext() {
		if (destinationStep.validate()) {
			goto('/my-trips/create/dates');
		}
	}

	// Get button text
	let buttonText = $derived(formData.destination ? `${formData.destination} 여행하기` : '다음');

	$effect(() => {
		console.log('data', data);
	});
</script>

<div class="flex-1 overflow-y-auto pb-32">
	<DestinationServerStep
		bind:this={destinationStep}
		{formData}
		onUpdate={handleUpdate}
		destinations={data.destinations}
	/>
</div>

<!-- Custom action button for destination -->
<div class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white p-4">
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

<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import DestinationServerStep from '$lib/components/trip-form/DestinationServerStep.svelte';
	import type { PageData } from './$types';

	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	let destinationStep: any;
	let formData = $state(tripCreateForm.getData());

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}

	// Check URL parameters on mount
	const urlParams = $page.url.searchParams;
	const destinationId = urlParams.get('id');
	const cityName = urlParams.get('city');

	// If we have URL parameters and no destination is selected yet
	if (destinationId && cityName && data.destinations) {
		const id = parseInt(destinationId);

		// Find the destination in the data
		for (const [country, destinations] of Object.entries(data.destinations)) {
			const destination = destinations.find((d: any) => d.id === id);
			if (destination) {
				// Pre-select the destination
				handleUpdate('destination', {
					id: destination.id,
					city: destination.city,
					country: destination.country.name,
					latitude: destination.latitude,
					longitude: destination.longitude
				});
				handleUpdate('destinationId', destination.id);

				// Skip to the next step immediately
				console.log('Destination pre-selected from home, skipping to dates step');
				goto('/my-trips/create/dates');
				break;
			}
		}
	}

	// Navigation
	function handleNext() {
		if (destinationStep.validate()) {
			goto('/my-trips/create/dates');
		}
	}

	// Get button text
	let buttonText = $derived(
		formData.destination
			? typeof formData.destination === 'string'
				? `${formData.destination} 여행하기`
				: `${formData.destination.city}, ${formData.destination.country} 여행하기`
			: '다음'
	);

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
<div class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white">
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

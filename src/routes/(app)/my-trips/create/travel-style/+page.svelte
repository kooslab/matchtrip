<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import TravelStyleStep from '$lib/components/trip-form/TravelStyleStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';

	let travelStyleStep: any;
	let formData = $state(tripCreateForm.getData());

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}

	// Navigation
	function handleNext() {
		if (travelStyleStep.validate()) {
			goto('/my-trips/create/activity');
		}
	}

	function handleBack() {
		goto('/my-trips/create/budget');
	}
</script>

<div class="pb-32">
	<TravelStyleStep bind:this={travelStyleStep} {formData} onUpdate={handleUpdate} />
</div>

<ActionButtons onNext={handleNext} onBack={handleBack} hasBottomNav={false} />

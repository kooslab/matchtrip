<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import ActivityStep from '$lib/components/trip-form/ActivityStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';

	let activityStep: any;
	let formData = $state(tripCreateForm.getData());

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}

	// Navigation
	function handleNext() {
		if (activityStep.validate()) {
			goto('/my-trips/create/additional-request');
		}
	}

	function handleBack() {
		goto('/my-trips/create/travel-style');
	}
</script>

<div class="flex-1 overflow-y-auto pb-32">
	<ActivityStep bind:this={activityStep} {formData} onUpdate={handleUpdate} />
</div>

<ActionButtons onNext={handleNext} onBack={handleBack} hasBottomNav={false} />

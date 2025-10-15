<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import DateRangeStep from '$lib/components/trip-form/DateRangeStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';

	let dateRangeStep: any;
	let formData = tripCreateForm.getData();

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}

	// Navigation
	function handleNext() {
		if (dateRangeStep.validate()) {
			goto('/my-trips/create/travelers');
		}
	}

	function handleBack() {
		goto('/my-trips/create/destination');
	}
</script>

<div class="pb-32">
	<DateRangeStep bind:this={dateRangeStep} {formData} onUpdate={handleUpdate} />
</div>

<ActionButtons onNext={handleNext} onBack={handleBack} hasBottomNav={false} />

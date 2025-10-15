<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import BudgetStep from '$lib/components/trip-form/BudgetStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';

	let budgetStep: any;
	let formData = $state(tripCreateForm.getData());

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}

	// Navigation
	function handleNext() {
		if (budgetStep.validate()) {
			goto('/my-trips/create/travel-style');
		}
	}

	function handleBack() {
		goto('/my-trips/create/travelers');
	}
</script>

<div class="pb-32">
	<BudgetStep bind:this={budgetStep} {formData} onUpdate={handleUpdate} />
</div>

<ActionButtons onNext={handleNext} onBack={handleBack} hasBottomNav={false} />

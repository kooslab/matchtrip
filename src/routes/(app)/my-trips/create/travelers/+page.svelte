<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import TravelersStep from '$lib/components/trip-form/TravelersStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';
	
	let travelersStep: TravelersStep;
	let formData = tripCreateForm.getData();
	
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}
	
	function handleNext() {
		if (travelersStep.validate()) {
			goto('/my-trips/create/budget');
		}
	}
	
	function handleBack() {
		goto('/my-trips/create/dates');
	}
</script>

<div class="px-4 py-6">
	<TravelersStep 
		bind:this={travelersStep}
		{formData} 
		onUpdate={handleUpdate} 
	/>
	
	<ActionButtons 
		onNext={handleNext}
		onBack={handleBack}
		hasBottomNav={false}
	/>
</div>
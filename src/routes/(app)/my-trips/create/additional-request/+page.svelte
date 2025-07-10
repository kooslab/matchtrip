<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import AdditionalRequestStep from '$lib/components/trip-form/AdditionalRequestStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';
	
	let additionalRequestStep: any;
	let formData = $state(tripCreateForm.getData());
	
	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}
	
	// Navigation
	function handleNext() {
		if (additionalRequestStep.validate()) {
			goto('/my-trips/create/files');
		}
	}
	
	function handleBack() {
		goto('/my-trips/create/activity');
	}
</script>

<div class="flex-1 overflow-y-auto pb-32">
	<AdditionalRequestStep 
		bind:this={additionalRequestStep}
		{formData} 
		onUpdate={handleUpdate} 
	/>
</div>

<ActionButtons 
	onNext={handleNext}
	onBack={handleBack}
	hasBottomNav={false}
/>
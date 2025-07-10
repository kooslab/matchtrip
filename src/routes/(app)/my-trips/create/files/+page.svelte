<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import FilesStep from '$lib/components/trip-form/FilesStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';
	
	let filesStep: any;
	let formData = $state(tripCreateForm.getData());
	
	// Update form data
	function handleUpdate(field: string, value: any) {
		tripCreateForm.updateStep(field, value);
		formData = tripCreateForm.getData();
	}
	
	// Navigation
	function handleNext() {
		if (filesStep.validate()) {
			goto('/my-trips/create/complete');
		}
	}
	
	function handleBack() {
		goto('/my-trips/create/additional-request');
	}
</script>

<div class="flex-1 overflow-y-auto pb-32">
	<FilesStep 
		bind:this={filesStep}
		{formData} 
		onUpdate={handleUpdate} 
	/>
</div>

<ActionButtons 
	onNext={handleNext}
	onBack={handleBack}
	hasBottomNav={false}
/>
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import FilesStep from '$lib/components/trip-form/FilesStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	let filesStep: any;

	// Subscribe to store and make it reactive
	let storeData = $state({});
	const unsubscribe = tripEditForm.subscribe((value) => {
		storeData = value;
	});

	// Use reactive formData that updates when store changes
	let formData = $derived(storeData);

	onMount(() => {
		return () => {
			unsubscribe();
		};
	});

	// Update form data
	function handleUpdate(field: string, value: any) {
		tripEditForm.updateStep(field, value);
	}

	// Navigation
	function handleNext() {
		if (filesStep.validate()) {
			goto(`/my-trips/${trip.id}/edit/complete`);
		}
	}

	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/additional-request`);
	}
</script>

<div class="flex-1 overflow-y-auto pb-32">
	<FilesStep bind:this={filesStep} {formData} onUpdate={handleUpdate} />
</div>

<ActionButtons onNext={handleNext} onBack={handleBack} hasBottomNav={false} />

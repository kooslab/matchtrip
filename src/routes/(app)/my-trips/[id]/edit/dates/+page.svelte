<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import DateRangeStep from '$lib/components/trip-form/DateRangeStep.svelte';
	import ActionButtons from '$lib/components/trip-form/ActionButtons.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	let dateRangeStep: any;

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
		if (dateRangeStep.validate()) {
			goto(`/my-trips/${trip.id}/edit/travelers`);
		}
	}

	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/destination`);
	}
</script>

<div class="flex-1 overflow-y-auto pb-32">
	{#if formData.startDate !== undefined}
		<DateRangeStep bind:this={dateRangeStep} {formData} onUpdate={handleUpdate} />
	{/if}
</div>

<ActionButtons onNext={handleNext} onBack={handleBack} hasBottomNav={false} />

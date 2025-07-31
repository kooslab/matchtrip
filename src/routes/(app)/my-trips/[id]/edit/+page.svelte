<script lang="ts">
	import { goto } from '$app/navigation';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Initialize form and redirect to destination page
	onMount(() => {
		tripEditForm.reset();
		tripEditForm.initializeFromTrip(trip);
		goto(`/my-trips/${trip.id}/edit/destination`, { replaceState: true });
	});
</script>

<svelte:head>
	<title>여행 수정 - {trip.destination?.city || '여행'}</title>
</svelte:head>

<!-- Loading state while redirecting -->
<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="text-center">
		<div
			class="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
		></div>
		<p class="text-gray-600">로딩중...</p>
	</div>
</div>

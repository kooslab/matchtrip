<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Event } from '$lib/server/db/schema';

	let activeEvent = $state<Event | null>(null);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			const response = await fetch('/api/events/active');
			const data = await response.json();
			activeEvent = data.event;
		} catch (error) {
			console.error('Failed to fetch active event:', error);
		} finally {
			isLoading = false;
		}
	});

	function handleEventClick() {
		if (activeEvent) {
			goto(`/event/${activeEvent.slug}`);
		}
	}
</script>

{#if !isLoading && activeEvent}
	<button
		onclick={handleEventClick}
		class="mx-auto mb-4 flex max-w-md items-center gap-3 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
	>
		<!-- Left: Text Content -->
		<div class="flex-1 text-left">
			<p class="text-xs text-gray-500">{activeEvent.subtitle}</p>
			<h3 class="text-sm font-semibold text-gray-900">{activeEvent.title}</h3>
		</div>

		<!-- Right: Banner Image -->
		<div class="h-16 w-24 flex-shrink-0 overflow-hidden rounded">
			<img
				src={activeEvent.bannerImageUrl}
				alt={activeEvent.title}
				class="h-full w-full object-cover"
			/>
		</div>
	</button>
{/if}
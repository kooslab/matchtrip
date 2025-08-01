<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronLeft, ChevronDown, ChevronUp, Search } from 'lucide-svelte';
	import { tripCreateForm } from '$lib/stores/tripCreateForm';
	import type { PageData } from './$types';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	// Search state
	let searchQuery = $state('');
	let expandedSections = $state<Set<string>>(new Set());
	let selectedDestination = $state<any>(null);

	// Form data
	let formData = $state(tripCreateForm.getData());

	// Toggle section
	function toggleSection(country: string) {
		if (expandedSections.has(country)) {
			expandedSections.delete(country);
		} else {
			expandedSections.add(country);
		}
		expandedSections = new Set(expandedSections);
	}

	// Filter destinations based on search
	let filteredDestinations = $derived(() => {
		if (!searchQuery.trim()) return data.destinations || {};

		const query = searchQuery.toLowerCase();
		const filtered: Record<string, typeof data.destinations[string]> = {};

		Object.entries(data.destinations || {}).forEach(([country, dests]) => {
			const matchingDests = dests.filter(
				(dest) =>
					dest.city.toLowerCase().includes(query) ||
					dest.country.name.toLowerCase().includes(query) ||
					country.toLowerCase().includes(query)
			);

			if (matchingDests.length > 0) {
				filtered[country] = matchingDests;
			}
		});

		return filtered;
	});

	// Auto-expand countries with search results
	$effect(() => {
		if (searchQuery.trim()) {
			// Get all countries that have matching destinations
			const countriesWithResults = Object.keys(filteredDestinations());
			// Clear and set new expanded sections
			expandedSections = new Set(countriesWithResults);
		} else {
			// Clear expanded sections when search is empty
			expandedSections = new Set();
		}
	});

	// Select destination
	function selectDestination(destination: any) {
		selectedDestination = destination;
		// Update form data
		tripCreateForm.updateStep('destination', {
			id: destination.id,
			city: destination.city,
			country: destination.country.name,
			latitude: destination.latitude,
			longitude: destination.longitude
		});
		tripCreateForm.updateStep('destinationId', destination.id);
		formData = tripCreateForm.getData();
	}

	// Navigate to next step
	function navigateToNext() {
		if (selectedDestination) {
			goto('/my-trips/create/dates');
		}
	}

	// Handle search input focus
	let searchInput: HTMLInputElement;
	$effect(() => {
		// Auto-focus search input on mount
		searchInput?.focus();
	});

	// Check URL parameters on mount
	$effect(() => {
		const urlParams = $page.url.searchParams;
		const destinationId = urlParams.get('id');
		const cityName = urlParams.get('city');

		// If we have URL parameters and no destination is selected yet
		if (destinationId && cityName && data.destinations && !selectedDestination) {
			const id = parseInt(destinationId);

			// Find the destination in the data
			for (const [country, destinations] of Object.entries(data.destinations)) {
				const destination = destinations.find((d: any) => d.id === id);
				if (destination) {
					// Pre-select the destination
					selectDestination(destination);
					// Auto-navigate to next step
					navigateToNext();
					break;
				}
			}
		}
	});
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header with Search -->
		<header class="sticky top-0 z-50 bg-white">
			<div class="flex items-center gap-3 p-4">
				<button onclick={() => goto('/my-trips')} class="p-1">
					<ChevronLeft class="h-6 w-6 text-blue-600" />
				</button>
				<div class="relative flex-1">
					<input
						bind:this={searchInput}
						type="text"
						bind:value={searchQuery}
						placeholder="어디로 가고 싶으신가요?"
						class="w-full rounded-full bg-gray-100 py-3 pl-5 pr-14 text-base placeholder-gray-400 focus:bg-gray-100 focus:outline-none"
					/>
					<div class="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500">
						<Search class="h-5 w-5 text-white" />
					</div>
				</div>
			</div>
		</header>

		<!-- Destinations List -->
		<main class="pb-20">
			{#each Object.entries(filteredDestinations()) as [country, destinations]}
				<div>
					<!-- Country Header -->
					<button
						onclick={() => toggleSection(country)}
						class="flex w-full items-center justify-between px-4 py-4 text-left border-b border-gray-100"
					>
						<h2 class="text-base font-bold text-gray-900">{country}</h2>
						{#if expandedSections.has(country)}
							<ChevronUp class="h-5 w-5 text-gray-400" />
						{:else}
							<ChevronDown class="h-5 w-5 text-gray-400" />
						{/if}
					</button>

					<!-- Cities List -->
					{#if expandedSections.has(country)}
						<div>
							{#each destinations as destination}
								<button
									onclick={() => selectDestination(destination)}
									class="flex w-full items-center justify-between px-4 py-4 text-left border-b border-gray-100 {selectedDestination?.id === destination.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}"
								>
									<span class="{selectedDestination?.id === destination.id ? 'text-blue-600 font-medium' : 'text-gray-700'} pl-8">{destination.city}</span>
									{#if selectedDestination?.id === destination.id}
										<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/each}

			{#if Object.keys(filteredDestinations()).length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">검색 결과가 없습니다</p>
				</div>
			{/if}
		</main>

		<!-- Bottom Button -->
		{#if selectedDestination}
			<div class="fixed bottom-0 left-0 right-0 bg-white shadow-lg">
				<div class="mx-auto max-w-[430px] p-4">
					<button
						onclick={navigateToNext}
						class="w-full rounded-lg bg-blue-500 py-4 font-semibold text-white transition-colors hover:bg-blue-600"
					>
						다음
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
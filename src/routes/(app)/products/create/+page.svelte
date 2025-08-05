<script lang="ts">
	import { goto } from '$app/navigation';
	import { ChevronDown, ChevronUp, Search } from 'lucide-svelte';
	
	const { data } = $props();
	
	// Get destinations from server data
	const destinations = $derived(data.destinations || {});
	const productData = $derived(data.productData);
	
	// UI state
	let searchQuery = $state('');
	let selectedDestinationId = $state(productData.destinationId);
	let expandedContinents = $state<Set<string>>(new Set());
	let expandedCountries = $state<Set<string>>(new Set());
	
	// Toggle continent expansion
	function toggleContinent(continentName: string) {
		if (expandedContinents.has(continentName)) {
			expandedContinents.delete(continentName);
			// Collapse all countries in this continent
			Object.keys(destinations[continentName]?.countries || {}).forEach(country => {
				expandedCountries.delete(`${continentName}-${country}`);
			});
		} else {
			expandedContinents.add(continentName);
		}
		expandedContinents = new Set(expandedContinents);
		expandedCountries = new Set(expandedCountries);
	}
	
	// Toggle country expansion
	function toggleCountry(continentName: string, countryName: string) {
		const key = `${continentName}-${countryName}`;
		if (expandedCountries.has(key)) {
			expandedCountries.delete(key);
		} else {
			expandedCountries.add(key);
		}
		expandedCountries = new Set(expandedCountries);
	}
	
	// Filter destinations based on search
	let filteredDestinations = $derived(() => {
		if (!searchQuery.trim()) return destinations;
		
		const query = searchQuery.toLowerCase();
		const filtered: typeof destinations = {};
		
		Object.entries(destinations).forEach(([continentName, continent]) => {
			const filteredCountries: typeof continent.countries = {};
			
			Object.entries(continent.countries).forEach(([countryName, country]) => {
				const filteredDests = country.destinations.filter(dest => 
					dest.city.toLowerCase().includes(query) ||
					countryName.toLowerCase().includes(query) ||
					continentName.toLowerCase().includes(query)
				);
				
				if (filteredDests.length > 0) {
					filteredCountries[countryName] = {
						...country,
						destinations: filteredDests
					};
				}
			});
			
			if (Object.keys(filteredCountries).length > 0) {
				filtered[continentName] = {
					...continent,
					countries: filteredCountries
				};
			}
		});
		
		return filtered;
	});
	
	// Auto-expand when searching
	$effect(() => {
		if (searchQuery.trim()) {
			// Expand all continents and countries with results
			const continentsToExpand = new Set<string>();
			const countriesToExpand = new Set<string>();
			
			Object.entries(filteredDestinations()).forEach(([continentName, continent]) => {
				continentsToExpand.add(continentName);
				Object.keys(continent.countries).forEach(countryName => {
					countriesToExpand.add(`${continentName}-${countryName}`);
				});
			});
			
			expandedContinents = continentsToExpand;
			expandedCountries = countriesToExpand;
		} else {
			// Clear expansions when search is cleared
			expandedContinents = new Set();
			expandedCountries = new Set();
		}
	});
	
	// Handle destination selection
	async function selectDestination(destinationId: number) {
		selectedDestinationId = destinationId;
	}
	
	// Navigate to next step
	async function navigateToNext() {
		if (!selectedDestinationId) return;
		
		// Save to cookies via API
		await fetch('/api/products/create/save-step', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				step: 'destination',
				data: { destinationId: selectedDestinationId }
			})
		});
		
		// Navigate to next step
		goto('/products/create/price');
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto min-h-screen max-w-[430px] bg-white">
		<!-- Header with Search -->
		<header class="sticky top-0 z-50 bg-white shadow-sm">
			<div class="px-4 py-3">
				<h2 class="text-lg font-semibold text-gray-900">여행 목적지를 선택해주세요</h2>
			</div>
			<div class="px-4 pb-3">
				<div class="relative">
					<input
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
			{#if Object.keys(filteredDestinations()).length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">검색 결과가 없습니다</p>
				</div>
			{:else}
				{#each Object.entries(filteredDestinations()) as [continentName, continent]}
					<div>
						<!-- Continent Header -->
						<button
							onclick={() => toggleContinent(continentName)}
							class="flex w-full items-center justify-between px-4 py-4 text-left bg-gray-50 border-b border-gray-200"
						>
							<h2 class="text-base font-bold text-gray-900">{continentName}</h2>
							{#if expandedContinents.has(continentName)}
								<ChevronUp class="h-5 w-5 text-gray-400" />
							{:else}
								<ChevronDown class="h-5 w-5 text-gray-400" />
							{/if}
						</button>
						
						<!-- Countries List -->
						{#if expandedContinents.has(continentName)}
							{#each Object.entries(continent.countries) as [countryName, country]}
								<div>
									<!-- Country Header -->
									<button
										onclick={() => toggleCountry(continentName, countryName)}
										class="flex w-full items-center justify-between px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50"
									>
										<span class="text-sm font-medium text-gray-700 pl-4">{countryName}</span>
										{#if expandedCountries.has(`${continentName}-${countryName}`)}
											<ChevronUp class="h-4 w-4 text-gray-400" />
										{:else}
											<ChevronDown class="h-4 w-4 text-gray-400" />
										{/if}
									</button>
									
									<!-- Cities List -->
									{#if expandedCountries.has(`${continentName}-${countryName}`)}
										<div class="bg-gray-50">
											{#each country.destinations as destination}
												<button
													onclick={() => selectDestination(destination.id)}
													class="flex w-full items-center justify-between px-4 py-3 text-left border-b border-gray-100 {selectedDestinationId === destination.id ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}"
												>
													<span class="{selectedDestinationId === destination.id ? 'text-blue-600 font-medium' : 'text-gray-700'} pl-8">
														{destination.city}
													</span>
													{#if selectedDestinationId === destination.id}
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
						{/if}
					</div>
				{/each}
			{/if}
		</main>
		
		<!-- Bottom Button -->
		{#if selectedDestinationId}
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
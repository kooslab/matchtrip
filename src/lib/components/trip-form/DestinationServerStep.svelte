<script lang="ts">
	interface Destination {
		id: number;
		city: string;
		imageUrl: string | null;
		country: {
			id: number;
			name: string;
			code: string;
		};
		continent: {
			id: number;
			name: string;
			code: string;
		};
	}
	
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
		destinations: Record<string, Destination[]>;
	}
	
	let { formData, onUpdate, destinations }: Props = $props();
	
	// Search state
	let searchQuery = $state('');
	let expandedSection = $state<string | null>(null);
	
	// Toggle section
	function toggleSection(sectionId: string) {
		expandedSection = expandedSection === sectionId ? null : sectionId;
	}
	
	// Select destination
	function selectDestination(destination: Destination) {
		onUpdate('destination', `${destination.city}, ${destination.country.name}`);
		onUpdate('destinationId', destination.id);
	}
	
	// Filter destinations based on search
	let filteredDestinations = $derived(() => {
		if (!searchQuery) return destinations;
		
		const query = searchQuery.toLowerCase();
		const filtered: Record<string, Destination[]> = {};
		
		Object.entries(destinations).forEach(([region, dests]) => {
			const matchingDests = dests.filter((dest) => 
				dest.city.toLowerCase().includes(query) || 
				dest.country.name.toLowerCase().includes(query)
			);
			
			if (matchingDests.length > 0) {
				filtered[region] = matchingDests;
			}
		});
		
		return filtered;
	});
	
	// Get selected destination object
	let selectedDestination = $derived(() => {
		if (!formData.destinationId) return null;
		
		for (const region of Object.values(destinations)) {
			const found = region.find((d) => d.id === formData.destinationId);
			if (found) return found;
		}
		return null;
	});
	
	// Validation
	export function validate() {
		if (!formData.destination || !formData.destinationId) {
			alert('목적지를 선택해주세요.');
			return false;
		}
		return true;
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Search Section -->
	<div class="bg-white px-4 py-6 shadow-sm">
		<div class="relative">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="어디로 떠나고 싶나요?"
				class="w-full rounded-full bg-gray-100 py-4 pl-12 pr-4 text-base placeholder-gray-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<div class="absolute left-4 top-1/2 -translate-y-1/2">
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
		</div>
	</div>
	
	<!-- Regions -->
	<div class="px-4 py-6">
		{#each Object.entries(filteredDestinations()) as [region, dests]}
			<div class="mb-4">
				<!-- Region Button -->
				<button
					onclick={() => toggleSection(region)}
					class="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
				>
					<div class="flex items-center gap-3">
						<h2 class="text-lg font-bold text-gray-900">{region}</h2>
						{#if selectedDestination && dests.find((d) => d.id === selectedDestination.id)}
							<span class="text-sm text-blue-600">
								{selectedDestination.city}
							</span>
						{/if}
					</div>
					<svg 
						class="h-5 w-5 text-gray-400 transition-transform {expandedSection === region ? 'rotate-180' : ''}" 
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>
				
				<!-- Expanded Destinations -->
				{#if expandedSection === region}
					<div class="mt-2 rounded-xl bg-white p-4 shadow-sm">
						<div class="space-y-2">
							{#each dests as destination}
								<button
									onclick={() => selectDestination(destination)}
									class="flex w-full items-center justify-between rounded-lg p-3 transition-colors {
										formData.destinationId === destination.id 
											? 'bg-blue-50 text-blue-600' 
											: 'hover:bg-gray-50'
									}"
								>
									<span class="font-medium">{destination.city}</span>
									{#if formData.destinationId === destination.id}
										<svg class="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
		
		{#if Object.keys(filteredDestinations()).length === 0}
			<div class="rounded-xl bg-white p-8 text-center">
				<p class="text-gray-500">검색 결과가 없습니다.</p>
			</div>
		{/if}
	</div>
</div>
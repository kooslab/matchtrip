<script lang="ts">
	import type { TripEditForm } from '$lib/stores/tripEditForm';
	
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}
	
	let { formData, onUpdate }: Props = $props();
	
	// Search state
	let searchQuery = $state(formData.destination ? `${formData.destination.city}, ${formData.destination.country}` : '');
	let results = $state<any[]>([]);
	let loading = $state(false);
	let showDropdown = $state(false);
	let debounceTimeout: ReturnType<typeof setTimeout>;
	
	// Search destinations
	async function searchDestinations(query: string) {
		if (query.length < 2) {
			results = [];
			showDropdown = false;
			return;
		}
		
		loading = true;
		try {
			const response = await fetch(`/api/destinations?q=${encodeURIComponent(query)}`);
			if (response.ok) {
				const data = await response.json();
				results = data.results || [];
				showDropdown = results.length > 0;
			}
		} catch (error) {
			console.error('Search error:', error);
		} finally {
			loading = false;
		}
	}
	
	// Debounced search
	function handleSearch(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchQuery = value;
		
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchDestinations(value);
		}, 300);
	}
	
	// Select destination
	function selectDestination(destination: any) {
		onUpdate('destination', `${destination.city}, ${destination.country}`);
		onUpdate('destinationId', destination.id);
		searchQuery = `${destination.city}, ${destination.country}`;
		showDropdown = false;
	}
	
	// Validation
	export function validate() {
		if (!formData.destination || !formData.destinationId) {
			alert('목적지를 선택해주세요.');
			return false;
		}
		return true;
	}
</script>

<div class="rounded-lg bg-white p-4">
	<h2 class="mb-4 text-lg font-semibold text-gray-900">어디로 여행하시나요?</h2>
	
	<!-- Search input -->
	<div class="relative">
		<input
			type="text"
			value={searchQuery}
			oninput={handleSearch}
			placeholder="도시 또는 국가 검색"
			class="w-full rounded-lg border border-gray-300 px-4 py-3 pr-10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
		/>
		
		{#if loading}
			<div class="absolute right-3 top-1/2 -translate-y-1/2">
				<div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
			</div>
		{/if}
		
		<!-- Search results dropdown -->
		{#if showDropdown && results.length > 0}
			<div class="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
				{#each results as result}
					<button
						onclick={() => selectDestination(result)}
						class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
					>
						<div class="flex-1">
							<p class="font-medium text-gray-900">{result.city}</p>
							<p class="text-sm text-gray-500">{result.country}</p>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
	
	<!-- Selected destination display -->
	{#if formData.destination}
		<div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
			<p class="text-sm text-blue-600">선택된 목적지:</p>
			<p class="font-medium text-blue-900">
				{formData.destination.city}, {formData.destination.country}
			</p>
		</div>
	{/if}
</div>
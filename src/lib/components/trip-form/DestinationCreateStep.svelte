<script lang="ts">
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}

	let { formData, onUpdate }: Props = $props();

	// Selected destination
	let selectedDestination = $state(formData.destination || null);

	// Expanded sections
	let expandedSection = $state<string | null>(null);

	// Regions
	const regions = [
		{
			id: 'europe',
			name: '유럽',
			destinations: [
				{ id: 1, city: '파리', country: '프랑스' },
				{ id: 2, city: '런던', country: '영국' },
				{ id: 3, city: '바르셀로나', country: '스페인' },
				{ id: 4, city: '로마', country: '이탈리아' },
				{ id: 5, city: '프라하', country: '체코' },
				{ id: 6, city: '암스테르담', country: '네덜란드' },
				{ id: 7, city: '베를린', country: '독일' },
				{ id: 8, city: '비엔나', country: '오스트리아' },
				{ id: 9, city: '부다페스트', country: '헝가리' },
				{ id: 10, city: '리스본', country: '포르투갈' }
			]
		},
		{
			id: 'korea',
			name: '국내',
			destinations: [
				{ id: 11, city: '서울', country: '대한민국' },
				{ id: 12, city: '부산', country: '대한민국' },
				{ id: 13, city: '제주', country: '대한민국' },
				{ id: 14, city: '경주', country: '대한민국' },
				{ id: 15, city: '전주', country: '대한민국' },
				{ id: 16, city: '강릉', country: '대한민국' },
				{ id: 17, city: '여수', country: '대한민국' },
				{ id: 18, city: '속초', country: '대한민국' },
				{ id: 19, city: '대전', country: '대한민국' },
				{ id: 20, city: '안동', country: '대한민국' }
			]
		}
	];

	// Toggle section
	function toggleSection(sectionId: string) {
		expandedSection = expandedSection === sectionId ? null : sectionId;
	}

	// Select destination
	function selectDestination(destination: any) {
		selectedDestination = destination;
		onUpdate('destination', `${destination.city}, ${destination.country}`);
		onUpdate('destinationId', destination.id);
	}

	// Validation
	export function validate() {
		if (!selectedDestination || !formData.destinationId) {
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
				placeholder="어디로 떠나고 싶나요?"
				class="w-full rounded-full bg-gray-100 py-4 pr-4 pl-12 text-base placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
				disabled
			/>
			<div class="absolute top-1/2 left-4 -translate-y-1/2">
				<svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
		</div>
	</div>

	<!-- Regions -->
	<div class="px-4 py-6">
		{#each regions as region}
			<div class="mb-4">
				<!-- Region Button -->
				<button
					onclick={() => toggleSection(region.id)}
					class="flex w-full items-center justify-between rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-md"
				>
					<div class="flex items-center gap-3">
						<h2 class="text-lg font-bold text-gray-900">{region.name}</h2>
						{#if selectedDestination && region.destinations.find((d) => d.id === selectedDestination.id)}
							<span class="text-sm text-blue-600">
								{selectedDestination.city}
							</span>
						{/if}
					</div>
					<svg
						class="h-5 w-5 text-gray-400 transition-transform {expandedSection === region.id
							? 'rotate-180'
							: ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						/>
					</svg>
				</button>

				<!-- Expanded Destinations -->
				{#if expandedSection === region.id}
					<div class="mt-2 rounded-xl bg-white p-4 shadow-sm">
						<div class="space-y-2">
							{#each region.destinations as destination}
								<button
									onclick={() => selectDestination(destination)}
									class="flex w-full items-center justify-between rounded-lg p-3 transition-colors {selectedDestination?.id ===
									destination.id
										? 'bg-blue-50 text-blue-600'
										: 'hover:bg-gray-50'}"
								>
									<span class="font-medium">{destination.city}</span>
									{#if selectedDestination?.id === destination.id}
										<svg
											class="h-5 w-5 text-blue-600"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

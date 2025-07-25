<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import iconArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get initial data from store
	let storeData = onboardingStore.get();

	onMount(() => {
		// Check if required data exists
		if (!storeData.name || !storeData.phone || !storeData.nickname) {
			goto('/onboarding/guide');
			return;
		}

		// Restore selected destinations if they exist
		if (storeData.destinations && Array.isArray(storeData.destinations)) {
			selectedDestinations = storeData.destinations;
		}
	});

	// Get destinations from server
	const destinationRegions = data.destinationRegions;

	let expandedRegions = $state<string[]>(destinationRegions.length > 0 ? [destinationRegions[0].name] : []); // Start with first region expanded
	let selectedDestinations = $state<number[]>([]);
	let isLoading = $state(false);
	let searchQuery = $state('');

	// Toggle region expansion
	function toggleRegion(regionName: string) {
		if (expandedRegions.includes(regionName)) {
			expandedRegions = expandedRegions.filter((r) => r !== regionName);
		} else {
			expandedRegions = [...expandedRegions, regionName];
		}
	}

	// Toggle destination selection
	function toggleDestination(destinationId: number) {
		if (selectedDestinations.includes(destinationId)) {
			selectedDestinations = selectedDestinations.filter((d) => d !== destinationId);
		} else {
			selectedDestinations = [...selectedDestinations, destinationId];
		}
	}

	// Filter destinations based on search query
	let filteredRegions = $derived(
		searchQuery
			? destinationRegions.map(region => ({
					...region,
					countries: region.countries.map(country => ({
						...country,
						cities: country.cities.filter(city => 
							city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							region.name.toLowerCase().includes(searchQuery.toLowerCase())
						)
					})).filter(country => country.cities.length > 0)
			  })).filter(region => region.countries.length > 0)
			: destinationRegions
	);

	// Validation
	function canProceed(): boolean {
		return selectedDestinations.length > 0;
	}

	// Handle next
	async function handleNext() {
		if (!canProceed()) return;

		isLoading = true;

		try {
			// Store destinations in store
			onboardingStore.setData({
				destinations: selectedDestinations
			});

			// Navigate to documents page
			await goto('/onboarding/guide/documents');
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// Handle back
	function handleBack() {
		// Save current selections to store before going back
		onboardingStore.setData({
			destinations: selectedDestinations
		});

		goto('/onboarding/guide/profile');
	}

	// Handle Enter key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (canProceed() && !isLoading) {
				handleNext();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="min-h-screen bg-white relative overflow-hidden">
	<div class="max-w-[430px] mx-auto">
		<!-- Header -->
		<header class="sticky top-0 z-10 bg-white/95 backdrop-blur-xl h-14 border-b-2 border-gray-100">
			<div class="flex items-center justify-between h-full px-4 relative">
				<button class="w-6 h-6 cursor-pointer" onclick={handleBack}>
					<img src={iconArrowBack} alt="뒤로가기" />
				</button>
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
					<div class="absolute bottom-0 left-0 w-2/3 h-0.5 bg-color-primary transition-all duration-300"></div>
				</div>
			</div>
		</header>

		<!-- Content -->
		<div class="px-4 pt-6 pb-32">
			<!-- Title -->
			<div class="mb-8">
				<h1 class="text-xl font-bold text-primary mb-2">가이드 지역</h1>
				<p class="text-xs text-color-secondary">가이드 가능한 지역을 선택해주세요</p>
			</div>

		<!-- Search -->
		<div class="relative mb-6">
			<input 
				type="text" 
				class="w-full h-12 bg-gray-50 border border-gray-200 rounded-lg px-5 pr-12 text-base text-primary placeholder-color-secondary focus:border-color-primary focus:bg-blue-50/50 transition-all duration-200 outline-none" 
				placeholder="가능한 지역을 검색해 보세요" 
				bind:value={searchQuery}
			/>
			<svg class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-color-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="m21 21-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
				/>
			</svg>
		</div>

		<!-- Destinations Selection -->
		<div class="space-y-2">
			{#if filteredRegions.length === 0}
				<div class="text-center py-16 text-color-secondary">
					<p>검색 결과가 없습니다.</p>
				</div>
			{:else}
				{#each filteredRegions as region}
					<div class="border border-gray-200 rounded-lg overflow-hidden">
						<div 
							class="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors duration-200" 
							onclick={() => toggleRegion(region.name)}
						>
							<div>
								<span class="font-semibold text-sm text-primary">{region.name}</span>
								<span class="ml-2 text-xs text-color-secondary">{region.code}</span>
							</div>
							<svg
								class="w-5 h-5 text-color-secondary transition-transform duration-200 {expandedRegions.includes(region.name) ? 'rotate-180' : ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="m19 9-7 7-7-7"
								/>
							</svg>
						</div>

						{#if expandedRegions.includes(region.name)}
							<div class="bg-gray-50 border-t border-gray-200">
								{#each region.countries as country}
									<div class="border-b border-gray-100 last:border-b-0">
										<div class="px-3 py-2 bg-gray-100 font-semibold text-xs text-primary">
											{country.name}
										</div>
										<div class="p-3 space-y-2">
											{#each country.cities as city}
												<div 
													class="flex items-center cursor-pointer group" 
													onclick={() => toggleDestination(city.id)}
												>
													<div
														class="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200 bg-white"
														style="{selectedDestinations.includes(city.id) ? 'border-color: #1095f4;' : 'border-color: #d1d5db;'}"
													>
														{#if selectedDestinations.includes(city.id)}
															<svg class="w-5 h-5 text-color-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="m5 13 4 4L19 7"
																/>
															</svg>
														{/if}
													</div>
													<div class="ml-3 flex-1">
														<span class="text-sm font-medium {selectedDestinations.includes(city.id) ? 'text-color-primary' : 'text-gray-900'}">{city.name}</span>
													</div>
												</div>
											{/each}
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
			</div>
		</div>

		<!-- Bottom Section -->
		<div class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 shadow-lg">
			<div class="max-w-[430px] mx-auto">
				<div class="p-2 pb-24">
					<button 
						class="w-full h-12 rounded-lg font-semibold text-white transition-all duration-200" 
						style="background-color: {canProceed() && !isLoading ? '#1095f4' : '#8ea0ac'}; {canProceed() && !isLoading ? '' : 'cursor: not-allowed;'}"
						disabled={!canProceed() || isLoading} 
						onclick={handleNext}
					>
						{isLoading ? '처리중...' : '다 음'}
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

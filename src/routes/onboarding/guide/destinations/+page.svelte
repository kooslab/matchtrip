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

	let expandedRegions = $state<string[]>(
		destinationRegions.length > 0 ? [destinationRegions[0].name] : []
	); // Start with first region expanded
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
			? destinationRegions
					.map((region) => ({
						...region,
						countries: region.countries
							.map((country) => ({
								...country,
								cities: country.cities.filter(
									(city) =>
										city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
										country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
										region.name.toLowerCase().includes(searchQuery.toLowerCase())
								)
							}))
							.filter((country) => country.cities.length > 0)
					}))
					.filter((region) => region.countries.length > 0)
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

<div class="relative min-h-screen overflow-hidden bg-white">
	<div class="mx-auto max-w-[430px]">
		<!-- Header -->
		<header class="sticky top-0 z-10 h-14 border-b-2 border-gray-100 bg-white/95 backdrop-blur-xl">
			<div class="relative flex h-full items-center justify-between px-4">
				<button class="h-6 w-6 cursor-pointer" onclick={handleBack}>
					<img src={iconArrowBack} alt="뒤로가기" />
				</button>
				<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-100">
					<div
						class="bg-color-primary absolute bottom-0 left-0 h-0.5 w-2/3 transition-all duration-300"
					></div>
				</div>
			</div>
		</header>

		<!-- Content -->
		<div class="px-4 pt-6 pb-32">
			<!-- Title -->
			<div class="mb-8">
				<h1 class="text-primary mb-2 text-xl font-bold">가이드 지역</h1>
				<p class="text-color-secondary text-xs">가이드 가능한 지역을 선택해주세요</p>
			</div>

			<!-- Search -->
			<div class="relative mb-6">
				<input
					type="text"
					class="text-primary placeholder-color-secondary focus:border-color-primary h-12 w-full rounded-lg border border-gray-200 bg-gray-50 px-5 pr-12 text-base transition-all duration-200 outline-none focus:bg-blue-50/50"
					placeholder="가능한 지역을 검색해 보세요"
					bind:value={searchQuery}
				/>
				<svg
					class="text-color-primary absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
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
					<div class="text-color-secondary py-16 text-center">
						<p>검색 결과가 없습니다.</p>
					</div>
				{:else}
					{#each filteredRegions as region}
						<div class="overflow-hidden rounded-lg border border-gray-200">
							<div
								class="flex cursor-pointer items-center justify-between bg-white p-4 transition-colors duration-200 hover:bg-gray-50"
								onclick={() => toggleRegion(region.name)}
							>
								<div>
									<span class="text-primary text-sm font-semibold">{region.name}</span>
									<span class="text-color-secondary ml-2 text-xs">{region.code}</span>
								</div>
								<svg
									class="text-color-secondary h-5 w-5 transition-transform duration-200 {expandedRegions.includes(
										region.name
									)
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
										d="m19 9-7 7-7-7"
									/>
								</svg>
							</div>

							{#if expandedRegions.includes(region.name)}
								<div class="border-t border-gray-200 bg-gray-50">
									{#each region.countries as country}
										<div class="border-b border-gray-100 last:border-b-0">
											<div class="text-primary bg-gray-100 px-3 py-2 text-xs font-semibold">
												{country.name}
											</div>
											<div class="space-y-2 p-3">
												{#each country.cities as city}
													<div
														class="group flex cursor-pointer items-center"
														onclick={() => toggleDestination(city.id)}
													>
														<div
															class="flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-all duration-200"
															style={selectedDestinations.includes(city.id)
																? 'border-color: #1095f4;'
																: 'border-color: #d1d5db;'}
														>
															{#if selectedDestinations.includes(city.id)}
																<svg
																	class="text-color-primary h-5 w-5"
																	fill="none"
																	stroke="currentColor"
																	viewBox="0 0 24 24"
																>
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
															<span
																class="text-sm font-medium {selectedDestinations.includes(city.id)
																	? 'text-color-primary'
																	: 'text-gray-900'}">{city.name}</span
															>
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
		<div
			class="fixed right-0 bottom-0 left-0 border-t border-gray-100 bg-white/95 shadow-lg backdrop-blur-lg"
		>
			<div class="mx-auto max-w-[430px]">
				<div class="p-4">
					<button
						class="h-12 w-full rounded-lg font-semibold text-white transition-all duration-200"
						style="background-color: {canProceed() && !isLoading
							? '#1095f4'
							: '#8ea0ac'}; {canProceed() && !isLoading ? '' : 'cursor: not-allowed;'}"
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

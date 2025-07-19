<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { ChevronDown, ChevronUp, Bell } from 'lucide-svelte';
	import BottomNav from '$lib/components/BottomNav.svelte';
	import GuideBottomNav from '$lib/components/GuideBottomNav.svelte';
	import logo from '$lib/images/Matchtrip.png';

	// Props from load function
	const { data } = $props();

	// Get user data from props
	const user = $derived(data?.user);
	const userRole = $derived(data?.userRole);
	const isGuide = $derived(userRole === 'guide');
	const isTraveler = $derived(userRole === 'traveler');

	// Random recommendation messages
	const recommendationMessages = [
		'가족과 함께 하기 좋은',
		'혼자 여행하기 좋은',
		'커플이 가기 좋은',
		'친구들과 함께하기 좋은',
		'모험을 즐기기 좋은',
		'휴식을 취하기 좋은',
		'문화를 체험하기 좋은',
		'음식을 즐기기 좋은',
		'자연을 만끽하기 좋은',
		'액티비티가 많은'
	];

	// Get random recommendation
	const randomMessage = $derived(
		recommendationMessages[Math.floor(Math.random() * recommendationMessages.length)]
	);
	const randomDestination = $derived(
		data.displayDestinations?.length > 0
			? data.displayDestinations[Math.floor(Math.random() * data.displayDestinations.length)]
			: null
	);

	// Collapsible states
	let supportOpen = $state(false);
	let partnershipOpen = $state(false);

	// Search functionality
	let searchQuery = $state(data.searchQuery || '');
	let showDropdown = $state(false);
	let searchInput: HTMLInputElement;
	let debounceTimer: ReturnType<typeof setTimeout>;
	let isSearching = $state(false);

	// Use server-side filtered destinations
	const filteredDestinations = $derived(
		searchQuery.trim() && data.destinations ? data.destinations : []
	);

	// Debounced search handler - now makes server request
	async function handleSearch(e: Event) {
		const target = e.target as HTMLInputElement;
		const query = target.value;
		searchQuery = query;
		
		clearTimeout(debounceTimer);
		
		if (!query.trim()) {
			showDropdown = false;
			// Clear search results
			await goto('/');
			return;
		}
		
		isSearching = true;
		debounceTimer = setTimeout(async () => {
			// Make server request with search query
			await goto(`/?q=${encodeURIComponent(query)}`, { 
				replaceState: true,
				keepFocus: true,
				noScroll: true 
			});
			showDropdown = true;
			isSearching = false;
		}, 300);
	}

	// Select destination
	function selectDestination(destination: typeof data.destinations[0]) {
		// Fill the search input with the selected city
		searchQuery = destination.city;
		showDropdown = false;
		
		// Navigate based on user role - now using destination ID
		if (!user) {
			goto('/');
		} else if (isGuide) {
			// Guide users go to trips page with destination ID filter
			goto(`/trips?destinations=${destination.id}`, { invalidateAll: true });
		} else if (isTraveler) {
			// Traveler users go to create trip with selected destination
			goto(`/my-trips/create/destination?id=${destination.id}&city=${encodeURIComponent(destination.city)}`);
		}
	}

	// Close dropdown when clicking outside
	function handleClickOutside(e: MouseEvent) {
		if (searchInput && !searchInput.contains(e.target as Node)) {
			showDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-50 bg-white shadow-sm">
		<div class="flex items-center justify-between px-4 py-4">
			<button onclick={() => goto('/')} class="flex items-center">
				<img src={logo} alt="Matchtrip" class="h-4 w-auto" />
			</button>
			<button class="relative p-2">
				<Bell class="h-6 w-6 text-gray-600" />
				<span class="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
			</button>
		</div>
	</header>

	<!-- Main Content -->
	<main class="pb-24">
		<!-- Recommendation Section -->
		{#if randomDestination}
			<section class="bg-white p-4">
				<div class="flex items-center gap-2 text-sm text-gray-600">
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					<span>{randomDestination.city}, {randomDestination.country}</span>
				</div>
				<h2 class="mt-2 text-lg font-medium text-gray-900">
					{randomMessage} <span class="text-blue-600">{randomDestination.city}</span> 어때요?
				</h2>
			</section>
		{/if}

		<!-- Search Section -->
		<section class="bg-white p-4">
			<div class="relative">
				<input
					bind:this={searchInput}
					bind:value={searchQuery}
					type="text"
					placeholder="어디로 가고 싶으신가요?"
					oninput={handleSearch}
					onfocus={() => (showDropdown = searchQuery.trim().length > 0)}
					class="w-full rounded-full bg-gray-100 px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onclick={() => {
						if (searchQuery.trim()) {
							if (!user) {
								goto('/');
							} else if (isGuide) {
								// Guide users go to trips page with search query
								goto(`/trips?search=${encodeURIComponent(searchQuery)}`, { invalidateAll: true });
							} else if (isTraveler) {
								// Traveler users go to create trip with search query
								goto(`/my-trips/create/destination?search=${encodeURIComponent(searchQuery)}`);
							}
						}
					}}
					class="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 rounded-full"
				>
					<svg
						class="h-5 w-5 text-blue-500"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fill-rule="evenodd"
							d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
							clip-rule="evenodd"
						/>
					</svg>
				</button>

				<!-- Autocomplete Dropdown -->
				{#if showDropdown}
					<div class="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-lg bg-white shadow-lg">
						{#if isSearching}
							<div class="flex items-center justify-center p-4">
								<div class="text-sm text-gray-500">검색 중...</div>
							</div>
						{:else if filteredDestinations.length > 0}
							{#each filteredDestinations as destination}
								<button
									onclick={() => selectDestination(destination)}
									class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
								>
									<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
									<div>
										<p class="font-medium text-gray-900">{destination.city}</p>
										<p class="text-sm text-gray-500">{destination.country}</p>
									</div>
								</button>
							{/each}
						{:else}
							<div class="p-4 text-center text-sm text-gray-500">
								검색 결과가 없습니다
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</section>

		<!-- Sample Destinations -->
		<section class="mt-4 bg-white p-4">
			<h3 class="mb-4 text-sm font-medium text-gray-500">
				나에게 맞는 가이드를 찾고 계신가요?
			</h3>
			<h2 class="mb-4 flex items-center justify-between text-xl font-bold text-gray-900">
				매치트립 나라별 가이드
				<button onclick={() => goto('/trips')} class="text-sm text-blue-600">
					<ChevronDown class="h-5 w-5" />
				</button>
			</h2>
			<div class="grid grid-cols-3 gap-3">
				{#each data.displayDestinations || [] as destination}
					<button
						onclick={() => goto(`/trips?destination=${destination.city}`)}
						class="overflow-hidden rounded-lg"
					>
						<div class="relative aspect-square">
							{#if destination.imageUrl}
								<img
									src={destination.imageUrl}
									alt={destination.city}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="flex h-full w-full items-center justify-center bg-gray-200">
									<span class="text-gray-400">No image</span>
								</div>
							{/if}
							<div
								class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
							></div>
							<div class="absolute bottom-2 left-2 text-left">
								<h3 class="text-sm font-medium text-white">{destination.city}</h3>
								<p class="text-xs text-white/80">{destination.country}</p>
							</div>
						</div>
					</button>
				{/each}
			</div>
		</section>

		<!-- Customer Support Center -->
		<section class="mt-4 bg-white">
			<button
				onclick={() => (supportOpen = !supportOpen)}
				class="flex w-full items-center justify-between p-4"
			>
				<span class="text-base font-medium text-gray-900">고객센터</span>
				{#if supportOpen}
					<ChevronUp class="h-5 w-5 text-gray-500" />
				{:else}
					<ChevronDown class="h-5 w-5 text-gray-500" />
				{/if}
			</button>
			{#if supportOpen}
				<div class="border-t px-4 pb-4">
					<div class="space-y-3 pt-4">
						<a href="/contact" class="block text-sm text-gray-600 hover:text-blue-600">
							문의하기
						</a>
						<a href="/terms" class="block text-sm text-gray-600 hover:text-blue-600">
							이용약관
						</a>
						<a href="/terms/privacy" class="block text-sm text-gray-600 hover:text-blue-600">
							개인정보처리방침
						</a>
						<a href="/terms/refund-policy" class="block text-sm text-gray-600 hover:text-blue-600">
							취소 및 환불 정책
						</a>
					</div>
				</div>
			{/if}
		</section>

		<!-- Affiliate Marketing Partnership -->
		<section class="mt-4 bg-white">
			<button
				onclick={() => (partnershipOpen = !partnershipOpen)}
				class="flex w-full items-center justify-between p-4"
			>
				<span class="text-base font-medium text-gray-900">제휴 문의</span>
				{#if partnershipOpen}
					<ChevronUp class="h-5 w-5 text-gray-500" />
				{:else}
					<ChevronDown class="h-5 w-5 text-gray-500" />
				{/if}
			</button>
			{#if partnershipOpen}
				<div class="border-t px-4 pb-4">
					<div class="space-y-3 pt-4">
						<p class="text-sm text-gray-600">
							매치트립과 함께 성장하고 싶으신가요?
						</p>
						<a
							href="/marketing-terms"
							class="block text-sm font-medium text-blue-600 hover:text-blue-700"
						>
							제휴 안내 보기
						</a>
						<a
							href="mailto:partnership@matchtrip.com"
							class="block text-sm font-medium text-blue-600 hover:text-blue-700"
						>
							이메일로 문의하기
						</a>
					</div>
				</div>
			{/if}
		</section>

		<!-- Footer -->
		<footer class="mt-8 bg-gray-100 p-4 text-center">
			<div class="space-y-4">
				<div class="flex justify-center gap-4 text-xs text-gray-500">
					<a href="/terms" class="hover:text-gray-700">이용약관</a>
					<span>|</span>
					<a href="/terms/privacy" class="hover:text-gray-700">개인정보처리방침</a>
					<span>|</span>
					<a href="/contact" class="hover:text-gray-700">취소 및 환불 정책</a>
					<span>|</span>
					<a href="/marketing-terms" class="hover:text-gray-700">제휴 안내</a>
				</div>
				<button
					onclick={() => goto('/admin')}
					class="text-xs text-gray-400 hover:text-gray-600"
				>
					에이전트 사업자 정보
				</button>
				<p class="text-xs text-gray-400">
					매치트립은 통신판매중개자이며, 통신판매의 당사자가 아닙니다.<br />
					상품, 상품정보, 거래에 관한 의무와 책임은 판매자에게 있습니다.
				</p>
				<p class="text-xs text-gray-500">
					© 2025 Matchtrip. All rights reserved.
				</p>
			</div>
		</footer>
	</main>

	<!-- Bottom Navigation -->
	{#if user}
		{#if isTraveler}
			<BottomNav />
		{:else if isGuide}
			<GuideBottomNav />
		{/if}
	{:else}
		<!-- Login prompt for non-authenticated users -->
		<div class="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
			<button
				onclick={() => goto('/')}
				class="w-full rounded-lg bg-blue-600 py-3 text-white font-medium hover:bg-blue-700"
			>
				로그인하여 시작하기
			</button>
		</div>
	{/if}
</div>
<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	let menuOpen = false;
	// let search = '';
	let results: any[] = $state([]);
	let loading = $state(false);
	let showDropdown = $state(false);
	let debounceTimeout: ReturnType<typeof setTimeout>;
	let fetchController: AbortController | null = null;
	let calendarOpen = $state(false);
	let selectedCity = $state<any>(undefined);
	import { DateRangePicker } from 'bits-ui';
	import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import { goto } from '$app/navigation';
	import { Plus, FilePlus } from 'phosphor-svelte';
	import { tripForm } from '$lib/stores/tripForm';

	// Modal state
	let showComingSoonModal = $state(false);

	function openComingSoonModal() {
		showComingSoonModal = true;
	}

	function closeComingSoonModal() {
		showComingSoonModal = false;
	}

	// Cache for API results
	const apiCache = new Map<string, { data: any; timestamp: number }>();
	const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

	// Preload images when component mounts
	$effect(() => {
		// Preload destination images
		data.destinations.forEach((destination) => {
			if (destination.imageUrl) {
				const img = new Image();
				img.src = destination.imageUrl;
			}
		});
	});

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		tripForm.update((f) => ({ ...f, search: target.value }));
		selectedCity = undefined;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => fetchResults(target.value), 300);
	}

	async function fetchResults(q: string) {
		if (!q) {
			results = [];
			showDropdown = false;
			return;
		}

		// Check cache first
		const cacheKey = `destinations-${q}`;
		const cached = apiCache.get(cacheKey);
		
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
			results = cached.data.results;
			showDropdown = results.length > 0;
			return;
		}

		loading = true;

		// Abort previous fetch if it exists
		if (fetchController) {
			fetchController.abort();
		}
		fetchController = new AbortController();

		try {
			const res = await fetch(`/api/destinations?q=${encodeURIComponent(q)}`, {
				signal: fetchController.signal,
				headers: {
					'Cache-Control': 'max-age=300' // Browser cache for 5 minutes
				}
			});
			const data = await res.json();
			
			// Store in cache
			apiCache.set(cacheKey, {
				data,
				timestamp: Date.now()
			});
			
			results = data.results;
			showDropdown = results.length > 0;
		} catch (err) {
			if (err.name !== 'AbortError') {
				console.error(err);
			}
		} finally {
			loading = false;
		}
	}

	function handleSelect(cityObj: any) {
		tripForm.update((f) => ({ ...f, search: cityObj.city, selectedCity: cityObj }));
		selectedCity = cityObj;
		showDropdown = false;
	}

	function resetCitySelection() {
		tripForm.update((f) => ({ ...f, search: '', selectedCity: undefined }));
		selectedCity = undefined;
		results = [];
		showDropdown = false;
	}

	function handlePeopleChange(val: number) {
		tripForm.update((f) => ({ ...f, people: val }));
	}

	function handleDateRangeChange(val: any) {
		tripForm.update((f) => ({ ...f, dateRange: val }));
	}

	function handleTourTypeChange(val: string) {
		tripForm.update((f) => ({ ...f, tourType: val }));
	}

	function handleSearch(event: Event) {
		event.preventDefault();
		if (!$tripForm.selectedCity || $tripForm.selectedCity.city !== $tripForm.search) {
			alert('목록에서 여행지를 선택해주세요.');
			return;
		}
		goto('/create-trip');
	}

	function handleBlur() {
		if (!$tripForm.selectedCity || $tripForm.selectedCity.city !== $tripForm.search) {
			tripForm.update((f) => ({ ...f, search: '', selectedCity: undefined }));
			selectedCity = undefined;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			if (!$tripForm.selectedCity || $tripForm.selectedCity.city !== $tripForm.search) {
				e.preventDefault();
				tripForm.update((f) => ({ ...f, search: '', selectedCity: undefined }));
				selectedCity = undefined;
			}
		}
	}

	// On page load, if search is prefilled, fetch results and set selectedCity
	$effect(() => {
		if ($tripForm.search && !$tripForm.selectedCity) {
			fetchResults($tripForm.search).then(() => {
				const match = results.find((dest) => dest.city === $tripForm.search);
				if (match) {
					tripForm.update((f) => ({ ...f, selectedCity: match }));
					selectedCity = match;
				}
			});
		}
	});

	$effect(() => {
		return () => {
			clearTimeout(debounceTimeout);
			if (fetchController) fetchController.abort();
		};
	});
</script>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Header -->
	<!-- <header class="relative flex items-center justify-center border-b px-4 py-3">
		<span class="rounded bg-gray-100 px-4 py-2 text-xl font-semibold">매치트립 로고</span>
	</header> -->

	<!-- Hero Section with Catchphrases -->
	<section class="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-8 md:py-12">
		<div class="mx-auto max-w-4xl text-center">
			<div class="mb-8 space-y-4">
				<h1 class="text-4xl font-bold text-white md:text-6xl">Match Trip</h1>
				<div class="flex flex-wrap justify-center gap-4 text-lg md:text-xl">
					<div
						class="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 shadow-sm backdrop-blur-sm">
						<span class="text-2xl">🎒</span>
						<span class="font-medium text-white">완벽한 여행</span>
					</div>
					<div
						class="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 shadow-sm backdrop-blur-sm">
						<span class="text-2xl">👨‍🔬</span>
						<span class="font-medium text-white">현지 전문가</span>
					</div>
					<div
						class="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 shadow-sm backdrop-blur-sm">
						<span class="text-2xl">🤝</span>
						<span class="font-medium text-white">안전한 연결</span>
					</div>
				</div>
				<p class="text-lg text-white/90 md:text-xl">
					나만의 특별한 여행을 현지 전문가와 함께 만들어보세요
				</p>
			</div>
		</div>
	</section>

	<!-- Search Bar -->
	<section class="bg-white px-4 py-8 md:py-12">
		<form
			class="mx-auto flex max-w-2xl flex-col gap-4 rounded-xl border bg-white px-4 py-4 shadow-sm md:flex-row md:items-center md:gap-4 md:px-6 md:py-6 md:shadow-lg"
			onsubmit={handleSearch}>
			<label class="shrink-0 text-sm font-medium text-gray-700 md:text-base"
				>어디로 가고 싶으신가요?</label>
			<div class="relative min-w-0 flex-1">
				<input
					class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none md:px-4 md:py-3 md:text-base"
					placeholder="여행지를 검색하세요"
					value={$tripForm.search}
					oninput={handleInput}
					onfocus={() => {
						if (results.length) showDropdown = true;
					}}
					onblur={handleBlur}
					onkeydown={handleKeydown}
					autocomplete="off"
					readonly={$tripForm.selectedCity && $tripForm.selectedCity.city === $tripForm.search} />
				{#if $tripForm.selectedCity && $tripForm.selectedCity.city === $tripForm.search}
					<button
						type="button"
						class="absolute top-2 right-2 text-xs text-blue-600 underline"
						onclick={resetCitySelection}>
						변경
					</button>
				{/if}
				{#if showDropdown}
					<ul
						class="absolute right-0 left-0 z-10 mt-1 max-h-60 overflow-auto rounded-xl border bg-white shadow-lg">
						{#if loading}
							<li class="p-2 text-center text-sm text-gray-400">검색 중...</li>
						{/if}
						{#each results as dest}
							<li
								class="flex cursor-pointer justify-between px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
								onmousedown={() => handleSelect(dest)}>
								<span>{dest.city}</span>
								<span class="text-gray-400">{dest.country}</span>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
			<button
				type="submit"
				class="w-full shrink-0 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 md:w-auto md:px-8 md:py-3 md:text-base">
				➡️ 여행 계획 시작하기
			</button>
		</form>
	</section>

	<!-- Recommended Destinations Section -->
	<section class="border-b bg-gray-50 px-4 py-12 md:py-20">
		<div class="mx-auto max-w-6xl">
			<div class="mb-8 text-center">
				<h2 class="mb-4 hidden text-3xl font-bold text-gray-900 md:block">
					🌍 Match Trip 서비스 지역
				</h2>
				<p class="text-lg text-gray-600">유럽 주요 인기 도시에서 현지 전문가와 함께하세요</p>
			</div>

			<!-- Destinations Grid - Dynamic from Database -->
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
				{#each data.destinations as destination, index}
					<div
						class="group relative overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105">
						{#if destination.imageUrl}
							<img
								src={destination.imageUrl}
								alt={destination.city}
								loading={index < 4 ? "eager" : "lazy"}
								decoding="async"
								class="aspect-square w-full bg-gray-200 object-cover object-center" />
						{:else}
							<img
								src="https://source.unsplash.com/featured/?{destination.city.toLowerCase()}"
								alt={destination.city}
								loading={index < 4 ? "eager" : "lazy"}
								decoding="async"
								class="aspect-square w-full bg-gray-200 object-cover object-center" />
						{/if}
						<div class="absolute inset-0 bg-black/30 transition-all group-hover:bg-black/40"></div>
						<div
							class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/70 to-transparent p-6">
							<h3 class="text-2xl font-bold text-white">{destination.city}</h3>
							<p class="text-gray-200">{destination.country}</p>
						</div>
					</div>
				{/each}

				{#if data.destinations.length === 0}
					<div class="col-span-full py-12 text-center">
						<p class="text-gray-500">아직 등록된 여행지가 없습니다.</p>
					</div>
				{/if}
			</div>
		</div>
	</section>
</div>

<!-- Coming Soon Modal -->
{#if showComingSoonModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		onclick={closeComingSoonModal}>
		<div
			class="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl"
			onclick={(e) => e.stopPropagation()}>
			<div class="text-center">
				<div class="mb-4 text-4xl">✈️</div>
				<h3 class="mb-2 text-xl font-bold text-gray-900">해당 서비스 지역은</h3>
				<h3 class="mb-4 text-xl font-bold text-gray-900">곧 오픈 예정입니다.</h3>
				<p class="mb-6 text-gray-600">
					더 많은 여행지에서 현지 전문가와 함께할 수 있도록 준비 중입니다.
				</p>
				<button
					class="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
					onclick={closeComingSoonModal}>
					확인
				</button>
			</div>
		</div>
	</div>
{/if}

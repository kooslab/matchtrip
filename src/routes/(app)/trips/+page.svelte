<script lang="ts">
	import { goto } from '$app/navigation';
	import { formatDate, formatDateRange } from '$lib/utils/dateFormatter';
	import { userTimezone, userLocale } from '$lib/stores/location';
	import calendarIconUrl from '$lib/icons/icon-calendar-check-mono.svg';
	import usersIconUrl from '$lib/icons/icon-user-two-mono.svg';
	import bookmarkIconUrl from '$lib/icons/icon-bookmark-mono.svg';
	import arrowDownIconUrl from '$lib/icons/icon-arrow-up-limit-mono.svg';
	import checkIconUrl from '$lib/icons/icon-check-circle-mono.svg';
	import chevronRightIconUrl from '$lib/icons/icon-arrow-right-small-mono.svg';
	import CitySelector from '$lib/components/CitySelector.svelte';
	import type { City } from '$lib/components/CitySelector.svelte';
	import { CalendarDate } from '@internationalized/date';
	import DateRangePickerModal from '$lib/components/DateRangePickerModal.svelte';
	import { page } from '$app/stores';

	let { data } = $props();

	let trips = $derived(data.trips);
	let userRole = $derived(data.userRole);
	let availableDestinations = $derived(data.destinations || []);

	// Filter states
	let selectedFilters = $state({
		destination: false,
		dates: false,
		people: false,
		budget: false
	});

	// Initialize selected cities from URL parameters
	const initializeFromUrl = () => {
		const destinationsParam = $page.url.searchParams.get('destinations');

		if (destinationsParam) {
			// Already using proper destinations parameter
			const ids = destinationsParam.split(',');
			return new Set(ids);
		}

		return new Set<string>();
	};

	// City search modal state
	let showCitySearchModal = $state(false);
	let selectedCityIds = $state<Set<string>>(initializeFromUrl());
	let citySelectorRef: CitySelector;

	// Date range picker state
	let showDateRangePicker = $state(false);
	let selectedDateRange = $state<{ start?: CalendarDate; end?: CalendarDate }>({});

	// People count selector state
	let showPeopleSelector = $state(false);
	let peopleCount = $state({
		adults: 2,
		children: 0,
		infants: 0
	});

	// Initialize filters from URL parameters
	const urlParams = $page.url.searchParams;

	// Set destination filter if in URL
	if (selectedCityIds.size > 0) {
		selectedFilters.destination = true;
	}

	// Set date filter if in URL
	if (urlParams.get('startDate') && urlParams.get('endDate')) {
		selectedFilters.dates = true;
		const startDate = new Date(urlParams.get('startDate')!);
		const endDate = new Date(urlParams.get('endDate')!);
		selectedDateRange = {
			start: new CalendarDate(
				startDate.getFullYear(),
				startDate.getMonth() + 1,
				startDate.getDate()
			),
			end: new CalendarDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate())
		};
	}

	// Set people filter if in URL
	if (urlParams.get('adults') || urlParams.get('children') || urlParams.get('infants')) {
		selectedFilters.people = true;
		if (urlParams.get('adults')) peopleCount.adults = parseInt(urlParams.get('adults')!);
		if (urlParams.get('children')) peopleCount.children = parseInt(urlParams.get('children')!);
		if (urlParams.get('infants')) peopleCount.infants = parseInt(urlParams.get('infants')!);
	}

	// Set budget filter if in URL
	if (urlParams.get('budgetMin') && urlParams.get('budgetMax')) {
		selectedFilters.budget = true;
		const min = urlParams.get('budgetMin');
		const max = urlParams.get('budgetMax');
		selectedBudget = `${min}-${max}`;
	}

	// Budget selector state
	let showBudgetSelector = $state(false);
	let selectedBudget = $state<string>('100-200');

	// Get unique destinations count
	let uniqueDestinations = $derived(
		new Set(trips.map((trip) => `${trip.destination.city}, ${trip.country.name}`)).size
	);

	// Clear all filters
	function clearAllFilters() {
		selectedCityIds = new Set<string>();
		selectedDateRange = {};
		peopleCount = { adults: 2, children: 0, infants: 0 };
		selectedBudget = '100-200';
		selectedFilters = {
			destination: false,
			dates: false,
			people: false,
			budget: false
		};
		goto('/trips');
	}

	// Check if any filter is active
	let hasActiveFilters = $derived(
		selectedFilters.destination ||
			selectedFilters.dates ||
			selectedFilters.people ||
			selectedFilters.budget
	);

	// Get status display info
	function getStatusInfo(status: string, hasOffer: boolean = false) {
		// For guide users viewing trips
		if (userRole === 'guide' && status === 'submitted') {
			if (hasOffer) {
				return { label: '제안중', class: 'bg-blue-500 text-white' };
			} else {
				return { label: '제안 전', class: 'bg-gray-500 text-white' };
			}
		}

		// Default status labels
		switch (status) {
			case 'submitted':
				return { label: '제안중', class: 'bg-blue-500 text-white' };
			case 'accepted':
				return { label: '진행중', class: 'bg-green-500 text-white' };
			case 'completed':
				return { label: '완료됨', class: 'bg-gray-500 text-white' };
			case 'cancelled':
				return { label: '취소됨', class: 'bg-red-500 text-white' };
			default:
				return { label: status, class: 'bg-gray-500 text-white' };
		}
	}

	function formatTripDate(date: Date | string) {
		return formatDate(date, {
			locale: $userLocale,
			timezone: $userTimezone,
			format: 'long'
		});
	}

	function formatTravelMethod(method: string | null) {
		if (!method) return '미정';

		const methodMap: Record<string, string> = {
			walking: '도보',
			driving: '자동차',
			public_transport: '대중교통',
			bike: '자전거',
			'walking+public_transport': '도보+대중교통',
			'walking+bike': '도보+자전거',
			'walking+driving': '도보+자동차',
			'walking+driving+public_transport': '도보+자동차+대중교통',
			'walking+driving+bike': '도보+자동차+자전거',
			'walking+driving+public_transport+bike': '모든 교통수단',
			other: '기타'
		};

		return methodMap[method] || method;
	}

	// City search functions
	function toggleCitySelection(cityId: string) {
		if (selectedCityIds.has(cityId)) {
			selectedCityIds.delete(cityId);
		} else {
			selectedCityIds.add(cityId);
		}
		selectedCityIds = new Set(selectedCityIds);
	}

	function applyCityFilter() {
		if (selectedCityIds.size > 0) {
			selectedFilters.destination = true;
			// Pass destination IDs directly
			const destinationParams = Array.from(selectedCityIds).join(',');
			const currentParams = new URLSearchParams(window.location.search);
			currentParams.set('destinations', destinationParams);
			goto(`/trips?${currentParams.toString()}`);
		}
		showCitySearchModal = false;
	}

	function openCitySearchModal() {
		showCitySearchModal = true;
		selectedFilters.destination = true;
	}

	// Date range functions
	function openDateRangePicker() {
		showDateRangePicker = true;
		selectedFilters.dates = true;
	}

	// Format CalendarDate for display
	function formatCalendarDate(calendarDate: CalendarDate | undefined) {
		if (!calendarDate) return '';

		const jsDate = new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);

		return new Intl.DateTimeFormat('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(jsDate);
	}

	function applyDateFilter(dates: { start?: CalendarDate; end?: CalendarDate }) {
		selectedDateRange = dates;

		if (dates.start && dates.end) {
			selectedFilters.dates = true;

			// Convert CalendarDate to JS Date and format
			const startDate = new Date(dates.start.year, dates.start.month - 1, dates.start.day);
			const endDate = new Date(dates.end.year, dates.end.month - 1, dates.end.day);

			// Format dates as YYYY-MM-DD
			const formatDateString = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			};

			const startDateStr = formatDateString(startDate);
			const endDateStr = formatDateString(endDate);

			const currentParams = new URLSearchParams(window.location.search);
			currentParams.set('startDate', startDateStr);
			currentParams.set('endDate', endDateStr);
			goto(`/trips?${currentParams.toString()}`);
		} else {
			// Clear date filter if no dates selected
			selectedFilters.dates = false;
			const currentParams = new URLSearchParams(window.location.search);
			currentParams.delete('startDate');
			currentParams.delete('endDate');
			goto(`/trips?${currentParams.toString()}`);
		}
		showDateRangePicker = false;
	}

	// Format date range for display
	const dateRangeDisplay = $derived(() => {
		if (selectedDateRange.start && selectedDateRange.end) {
			const start = new Date(
				selectedDateRange.start.year,
				selectedDateRange.start.month - 1,
				selectedDateRange.start.day
			);
			const end = new Date(
				selectedDateRange.end.year,
				selectedDateRange.end.month - 1,
				selectedDateRange.end.day
			);
			return `${formatDate(start, { format: 'short' })} - ${formatDate(end, { format: 'short' })}`;
		}
		return '';
	});

	// People selector functions
	function openPeopleSelector() {
		showPeopleSelector = true;
		selectedFilters.people = true;
	}

	function applyPeopleFilter() {
		selectedFilters.people = true;
		const currentParams = new URLSearchParams(window.location.search);
		currentParams.set('adults', peopleCount.adults.toString());
		currentParams.set('children', peopleCount.children.toString());
		if (peopleCount.infants > 0) {
			currentParams.set('infants', peopleCount.infants.toString());
		}
		goto(`/trips?${currentParams.toString()}`);
		showPeopleSelector = false;
	}

	// Format people count for display
	const peopleCountDisplay = $derived(() => {
		// Only show count if filter is actually active
		if (!selectedFilters.people) return '';

		const total = peopleCount.adults + peopleCount.children + peopleCount.infants;
		if (total > 0) {
			const parts = [];
			if (peopleCount.adults > 0) parts.push(`성인 ${peopleCount.adults}명`);
			if (peopleCount.children > 0) parts.push(`어린이 ${peopleCount.children}명`);
			if (peopleCount.infants > 0) parts.push(`유아 ${peopleCount.infants}명`);
			return parts.join(', ');
		}
		return '';
	});

	// Increment/decrement functions
	function incrementCount(type: 'adults' | 'children' | 'infants') {
		if (type === 'adults' && peopleCount.adults < 10) {
			peopleCount.adults++;
		} else if (type === 'children' && peopleCount.children < 10) {
			peopleCount.children++;
		} else if (type === 'infants' && peopleCount.infants < 10) {
			peopleCount.infants++;
		}
	}

	function decrementCount(type: 'adults' | 'children' | 'infants') {
		if (type === 'adults' && peopleCount.adults > 1) {
			peopleCount.adults--;
		} else if (type === 'children' && peopleCount.children > 0) {
			peopleCount.children--;
		} else if (type === 'infants' && peopleCount.infants > 0) {
			peopleCount.infants--;
		}
	}

	// Budget selector functions
	function openBudgetSelector() {
		showBudgetSelector = true;
		selectedFilters.budget = true;
	}

	function applyBudgetFilter() {
		selectedFilters.budget = true;
		const currentParams = new URLSearchParams(window.location.search);

		// Parse budget range
		const [min, max] = selectedBudget.split('-').map((v) => parseInt(v));
		if (min) currentParams.set('budgetMin', min.toString());
		if (max) currentParams.set('budgetMax', max.toString());

		goto(`/trips?${currentParams.toString()}`);
		showBudgetSelector = false;
	}

	// Budget options
	const budgetOptions = [
		{ value: '50-100', label: '50-100만원' },
		{ value: '100-200', label: '100-200만원' },
		{ value: '200-500', label: '200-500만원' }
	];

	// Format budget for display
	const budgetDisplay = $derived(() => {
		// Only show budget if filter is actually active
		if (!selectedFilters.budget) return '';

		const option = budgetOptions.find((opt) => opt.value === selectedBudget);
		return option?.label || '';
	});

	// Check if any modal is open
	let isAnyModalOpen = $derived(
		showCitySearchModal || showDateRangePicker || showPeopleSelector || showBudgetSelector
	);

	// Format budget range for display
	function formatBudgetRange(min: number | null, max: number | null): string {
		if (!min && !max) return '예산 미정';
		if (min && !max) return `${(min / 10000).toLocaleString()}만원 이상`;
		if (!min && max) return `${(max / 10000).toLocaleString()}만원 이하`;
		return `${(min / 10000).toLocaleString()}~${(max / 10000).toLocaleString()}만원`;
	}

	// Add/remove class to body when modal state changes
	$effect(() => {
		if (isAnyModalOpen) {
			document.body.classList.add('modal-open');
		} else {
			document.body.classList.remove('modal-open');
		}

		// Cleanup on unmount
		return () => {
			document.body.classList.remove('modal-open');
		};
	});
</script>

<svelte:head>
	<title>여행찾기 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 {!isAnyModalOpen ? 'pb-24' : ''}">
	<!-- Filter Bar -->
	<div class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="container mx-auto px-4 py-2">
			<div class="scrollbar-hide flex gap-1.5 overflow-x-auto">
				<button
					onclick={openCitySearchModal}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.destination
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span
						>{selectedCityIds.size === 0
							? '전체'
							: selectedCityIds.size === 1
								? (() => {
										const cityId = Array.from(selectedCityIds)[0];
										const city = availableDestinations.find((d) => d.id.toString() === cityId);
										return city ? city.city : '1곳';
									})()
								: `여행지 ${selectedCityIds.size}곳`}</span
					>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.destination ? 'brightness-0 invert' : ''}"
					/>
				</button>
				<button
					onclick={openDateRangePicker}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.dates
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span>{dateRangeDisplay() || '일정 전체'}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.dates ? 'brightness-0 invert' : ''}"
					/>
				</button>
				<button
					onclick={openPeopleSelector}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.people
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span>{peopleCountDisplay() || '인원 전체'}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.people ? 'brightness-0 invert' : ''}"
					/>
				</button>
				<button
					onclick={openBudgetSelector}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.budget
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
				>
					<span>{budgetDisplay() || '예산 전체'}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.budget ? 'brightness-0 invert' : ''}"
					/>
				</button>

				{#if hasActiveFilters}
					<button
						onclick={clearAllFilters}
						class="flex flex-shrink-0 items-center gap-1 rounded-full border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
					>
						<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						<span>필터 초기화</span>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- City Search Modal -->
	{#if showCitySearchModal}
		<div class="fixed inset-0 z-50 flex items-end justify-center">
			<!-- Backdrop -->
			<div class="absolute inset-0 bg-black/60" onclick={() => (showCitySearchModal = false)}></div>

			<!-- Modal Content -->
			<div
				class="animate-slide-up relative h-[80vh] w-full max-w-lg overflow-hidden rounded-t-[40px] bg-white shadow-xl"
			>
				<CitySelector
					bind:this={citySelectorRef}
					selectedCities={selectedCityIds}
					{availableDestinations}
					onCityToggle={toggleCitySelection}
					onClose={() => (showCitySearchModal = false)}
					onSubmit={applyCityFilter}
					submitText={`${selectedCityIds.size}개 지역`}
				/>
			</div>
		</div>
	{/if}

	<!-- Date Range Picker Modal -->
	<DateRangePickerModal
		open={showDateRangePicker}
		bind:value={selectedDateRange}
		onClose={() => (showDateRangePicker = false)}
		onApply={applyDateFilter}
		title="여행 일정"
	/>

	<!-- People Selector Modal -->
	{#if showPeopleSelector}
		<div class="fixed inset-0 z-50 flex items-end justify-center">
			<!-- Backdrop -->
			<div class="absolute inset-0 bg-black/60" onclick={() => (showPeopleSelector = false)}></div>

			<!-- Modal Content -->
			<div class="animate-slide-up relative w-full max-w-lg rounded-t-[40px] bg-white shadow-xl">
				<div class="px-6 pt-6 pb-8">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-lg font-semibold">인원</h2>
						<button
							onclick={() => (showPeopleSelector = false)}
							class="text-gray-400 hover:text-gray-600"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					<div class="space-y-6">
						<!-- Adults -->
						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium text-gray-900">어른</div>
								<div class="text-sm text-gray-500">만 13세 이상</div>
							</div>
							<div class="flex items-center gap-3">
								<button
									onclick={() => decrementCount('adults')}
									disabled={peopleCount.adults <= 1}
									class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors
										{peopleCount.adults > 1
										? 'text-gray-700 hover:bg-gray-100'
										: 'cursor-not-allowed text-gray-400 opacity-50'}"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20 12H4"
										/>
									</svg>
								</button>
								<span class="w-8 text-center font-medium">{peopleCount.adults}</span>
								<button
									onclick={() => incrementCount('adults')}
									disabled={peopleCount.adults >= 10}
									class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors
										{peopleCount.adults < 10
										? 'text-gray-700 hover:bg-gray-100'
										: 'cursor-not-allowed text-gray-400 opacity-50'}"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</button>
							</div>
						</div>

						<!-- Children -->
						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium text-gray-900">어린이</div>
								<div class="text-sm text-gray-500">만 6세 ~ 만 12세</div>
							</div>
							<div class="flex items-center gap-3">
								<button
									onclick={() => decrementCount('children')}
									disabled={peopleCount.children <= 0}
									class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors
										{peopleCount.children > 0
										? 'text-gray-700 hover:bg-gray-100'
										: 'cursor-not-allowed text-gray-400 opacity-50'}"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20 12H4"
										/>
									</svg>
								</button>
								<span class="w-8 text-center font-medium">{peopleCount.children}</span>
								<button
									onclick={() => incrementCount('children')}
									disabled={peopleCount.children >= 10}
									class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors
										{peopleCount.children < 10
										? 'text-gray-700 hover:bg-gray-100'
										: 'cursor-not-allowed text-gray-400 opacity-50'}"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</button>
							</div>
						</div>

						<!-- Infants -->
						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium text-gray-900">유아</div>
								<div class="text-sm text-gray-500">만 6세 미만</div>
							</div>
							<div class="flex items-center gap-3">
								<button
									onclick={() => decrementCount('infants')}
									disabled={peopleCount.infants <= 0}
									class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors
										{peopleCount.infants > 0
										? 'text-gray-700 hover:bg-gray-100'
										: 'cursor-not-allowed text-gray-400 opacity-50'}"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M20 12H4"
										/>
									</svg>
								</button>
								<span class="w-8 text-center font-medium">{peopleCount.infants}</span>
								<button
									onclick={() => incrementCount('infants')}
									disabled={peopleCount.infants >= 10}
									class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 transition-colors
										{peopleCount.infants < 10
										? 'text-gray-700 hover:bg-gray-100'
										: 'cursor-not-allowed text-gray-400 opacity-50'}"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
								</button>
							</div>
						</div>
					</div>

					<div class="mt-8">
						<button
							onclick={applyPeopleFilter}
							class="w-full rounded-xl bg-blue-500 py-4 font-medium text-white transition-colors hover:bg-blue-600"
						>
							선택
						</button>
					</div>
				</div>

				<!-- Bottom indicator for swipe -->
				<div class="pointer-events-none absolute right-0 bottom-0 left-0 flex justify-center pb-2">
					<div class="h-[5px] w-[134px] rounded-[100px] bg-[#052236]"></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Budget Selector Modal -->
	{#if showBudgetSelector}
		<div class="fixed inset-0 z-50 flex items-end justify-center">
			<!-- Backdrop -->
			<div class="absolute inset-0 bg-black/60" onclick={() => (showBudgetSelector = false)}></div>

			<!-- Modal Content -->
			<div class="animate-slide-up relative w-full max-w-lg rounded-t-[40px] bg-white shadow-xl">
				<div class="px-6 pt-6 pb-8">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-lg font-semibold">예산</h2>
						<button
							onclick={() => (showBudgetSelector = false)}
							class="text-gray-400 hover:text-gray-600"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
						</button>
					</div>

					<div class="space-y-3">
						{#each budgetOptions as option}
							<button
								onclick={() => (selectedBudget = option.value)}
								class="flex w-full items-center justify-between rounded-xl border p-4 transition-all
									{selectedBudget === option.value
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
							>
								<span
									class="text-base font-medium {selectedBudget === option.value
										? 'text-blue-600'
										: 'text-gray-900'}"
								>
									{option.label}
								</span>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full border-2
									{selectedBudget === option.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}"
								>
									{#if selectedBudget === option.value}
										<svg
											class="h-3.5 w-3.5 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="3"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									{/if}
								</div>
							</button>
						{/each}
					</div>

					<div class="mt-8">
						<button
							onclick={applyBudgetFilter}
							class="w-full rounded-xl bg-blue-500 py-4 font-medium text-white transition-colors hover:bg-blue-600"
						>
							선택
						</button>
					</div>
				</div>

				<!-- Bottom indicator for swipe -->
				<div class="pointer-events-none absolute right-0 bottom-0 left-0 flex justify-center pb-2">
					<div class="h-[5px] w-[134px] rounded-[100px] bg-[#052236]"></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Unverified Guide Banner -->
	{#if userRole === 'guide' && !data.isGuideVerified}
		<div class="border-b border-yellow-200 bg-yellow-50">
			<div class="container mx-auto px-4 py-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<svg
							class="h-5 w-5 flex-shrink-0 text-yellow-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							></path>
						</svg>
						<div class="text-sm text-yellow-800">
							<p class="font-medium">가이드 승인 대기 중</p>
							<p class="mt-0.5 text-xs">승인 완료 후 여행자에게 제안을 보낼 수 있습니다</p>
						</div>
					</div>
					<a
						href="/guide/pending-approval"
						class="text-sm font-medium text-yellow-700 hover:text-yellow-800"
					>
						자세히 보기
					</a>
				</div>
			</div>
		</div>
	{/if}

	<div class="container mx-auto px-4 py-6">
		<div class="mb-6">
			<div class="mb-4 flex items-center justify-between">
				<div class="flex items-center gap-2">
					<span class="text-2xl font-bold text-gray-900">전체</span>
					<span class="text-2xl font-bold text-blue-600">{trips.length}</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="flex items-center gap-2 text-sm text-gray-600">
						<img src={checkIconUrl} alt="Check" class="h-4 w-4" />
						<span>완료된 여행 제외</span>
					</div>
					<button
						class="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						최신순
						<img src={arrowDownIconUrl} alt="" class="h-4 w-4" />
					</button>
				</div>
			</div>
		</div>

		{#if trips.length === 0}
			<div class="py-12 text-center">
				<div class="mx-auto mb-4 h-24 w-24 text-gray-400">
					<svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">
					{#if userRole === 'guide'}
						현재 희망하는 여행자가 없습니다.
					{:else}
						현재 이용 가능한 여행이 없습니다
					{/if}
				</h3>
				<p class="text-gray-500">
					{#if userRole === 'guide'}
						새로운 여행 요청이 들어오면 알려드릴게요!
					{:else}
						곧 새로운 여행이 등록될 예정입니다.
					{/if}
				</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each trips as trip}
					<div
						class="w-full overflow-hidden rounded-lg bg-white text-left shadow-sm transition-shadow hover:shadow-md"
					>
						<div class="p-4">
							<!-- Clickable upper section -->
							<div
								onclick={() => goto(`/trips/${trip.id}`)}
								role="button"
								tabindex="0"
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										goto(`/trips/${trip.id}`);
									}
								}}
								class="cursor-pointer"
							>
								<div class="mb-3 flex items-start justify-between">
									<div class="flex-1">
										<div class="mb-1 flex items-center gap-2">
											<span
												class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {getStatusInfo(
													trip.status,
													!!trip.hasOffer
												).class}"
											>
												{getStatusInfo(trip.status, !!trip.hasOffer).label}
											</span>
										</div>
										<h3 class="mb-2 text-base font-semibold text-gray-900">
											{trip.destination.city}, {trip.country.name}
										</h3>
									</div>
									<button
										onclick={(e) => e.stopPropagation()}
										class="text-gray-400 transition-colors hover:text-gray-600"
									>
										<img src={bookmarkIconUrl} alt="Bookmark" class="h-5 w-5" />
									</button>
								</div>

								<div class="mb-3 space-y-1">
									<div class="flex items-center gap-2 text-sm text-gray-600">
										<svg
											class="h-4 w-4 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										<span
											>{formatDateRange(trip.startDate, trip.endDate, {
												locale: $userLocale,
												timezone: $userTimezone,
												format: 'short'
											})}</span
										>
									</div>

									<div class="flex items-center gap-2 text-sm text-gray-600">
										<svg
											class="h-4 w-4 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
										<span
											>성인 {trip.adultsCount}명{#if trip.childrenCount > 0}
												아동 {trip.childrenCount}명{/if}</span
										>
									</div>
								</div>

								<div class="-mx-4 mb-4 px-4">
									<div class="scrollbar-hide flex gap-2 overflow-x-auto">
										<span
											class="inline-flex flex-shrink-0 items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
										>
											{formatBudgetRange(trip.budgetMin, trip.budgetMax)}
										</span>
										<span
											class="inline-flex flex-shrink-0 items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
										>
											{formatTravelMethod(trip.travelMethod)}
										</span>
										<span
											class="inline-flex flex-shrink-0 items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
										>
											자연 / 아웃도어
										</span>
									</div>
								</div>
							</div>

							<div class="border-t border-gray-100 pt-4">
								<details class="group" onclick={(e) => e.stopPropagation()}>
									<summary
										class="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900"
										onclick={(e) => e.stopPropagation()}
									>
										요청 사항
										<svg
											class="h-5 w-5 transition-transform group-open:rotate-180"
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
									</summary>
									<div class="mt-3 space-y-3">
										{#if trip.customRequest}
											<div class="text-sm text-gray-600">
												{trip.customRequest}
											</div>
										{:else}
											<div class="text-sm text-gray-500">특별한 요청사항이 없습니다.</div>
										{/if}

										<div class="flex items-center justify-between border-t border-gray-100 pt-3">
											<div class="text-sm">
												<span class="text-gray-500">남은 기간</span>
												<span class="ml-2 font-medium text-gray-900">7일</span>
											</div>
										</div>

										<div class="grid grid-cols-2 gap-3 pt-3">
											<div>
												<p class="mb-2 text-xs text-gray-500">자세히 보기</p>
												<button
													onclick={(e) => {
														e.stopPropagation();
														goto(`/trips/${trip.id}`);
													}}
													class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
												>
													자세히 보기
												</button>
											</div>
											<div>
												{#if trip.hasOffer}
													<p class="mb-2 text-xs text-gray-500">제안 상태</p>
													<button
														onclick={(e) => {
															e.stopPropagation();
															// Navigate to conversation if exists
															if (trip.conversationId) {
																goto(`/chat/${trip.conversationId}`);
															}
														}}
														disabled={!trip.conversationId}
														class="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 {trip.conversationId
															? 'hover:bg-gray-200'
															: 'cursor-default'}"
													>
														{#if trip.offerStatus === 'pending'}
															검토 중
														{:else if trip.offerStatus === 'accepted'}
															수락됨
														{:else if trip.offerStatus === 'rejected'}
															거절됨
														{:else}
															제안됨
														{/if}
													</button>
												{:else}
													<p class="mb-2 text-xs text-gray-500">&nbsp;</p>
													<button
														onclick={(e) => {
															e.stopPropagation();
															// Go directly to offer creation
															goto(`/offers/create/trip-info?tripId=${trip.id}`);
														}}
														class="w-full rounded-lg bg-[#2B2D5B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2147]"
													>
														제안하기
													</button>
												{/if}
											</div>
										</div>
									</div>
								</details>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Hide scrollbar for Chrome, Safari and Opera */
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Hide scrollbar for IE, Edge and Firefox */
	.scrollbar-hide {
		-ms-overflow-style: none; /* IE and Edge */
		scrollbar-width: none; /* Firefox */
	}

	/* Slide up animation for modal */
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}

	/* Hide bottom nav when modal is open */
	:global(body.modal-open .fixed.bottom-0.left-1\/2) {
		display: none;
	}
</style>

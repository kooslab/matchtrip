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
	import { DateRangePicker } from 'bits-ui';
	import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';

	let { data } = $props();

	let trips = $derived(data.trips);
	let userRole = $derived(data.userRole);

	// Loading state for proposal navigation
	let navigatingTripId = $state<string | null>(null);

	// Filter states
	let selectedFilters = $state({
		destination: false,
		dates: false,
		people: false,
		budget: false
	});

	// City search modal state
	let showCitySearchModal = $state(false);
	let selectedCityIds = $state<Set<string>>(new Set());
	let citySelectorRef: CitySelector;

	// Date range picker state
	let showDateRangePicker = $state(false);
	let selectedDateRange = $state<{ start?: Date; end?: Date }>({});
	let dateRangeOpen = $state(false);

	// People count selector state
	let showPeopleSelector = $state(false);
	let peopleCount = $state({
		adults: 2,
		children: 0,
		infants: 0
	});

	// Budget selector state
	let showBudgetSelector = $state(false);
	let selectedBudget = $state<string>('100-200');

	// Get unique destinations count
	let uniqueDestinations = $derived(
		new Set(trips.map((trip) => `${trip.destination.city}, ${trip.destination.country}`)).size
	);

	// Get status display info
	function getStatusInfo(status: string) {
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

	async function goToOffer(tripId: string) {
		navigatingTripId = tripId;
		try {
			await goto(`/offers?tripId=${tripId}`);
		} finally {
			navigatingTripId = null;
		}
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
			// Get city names from the selector component
			const selectedCities = citySelectorRef?.getCitiesByIds(Array.from(selectedCityIds)) || [];
			const cityParams = selectedCities.map(c => c.nameEn).join(',');
			goto(`/trips?cities=${encodeURIComponent(cityParams)}`);
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
		dateRangeOpen = true;
		selectedFilters.dates = true;
	}

	function applyDateFilter() {
		if (selectedDateRange.start && selectedDateRange.end) {
			selectedFilters.dates = true;
			// Convert to Date objects if needed and format
			const startDate = new Date(selectedDateRange.start);
			const endDate = new Date(selectedDateRange.end);
			
			// Format dates as YYYY-MM-DD
			const formatDateString = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				return `${year}-${month}-${day}`;
			};
			
			const startDateStr = formatDateString(startDate);
			const endDateStr = formatDateString(endDate);
			
			goto(`/trips?startDate=${startDateStr}&endDate=${endDateStr}`);
		}
		showDateRangePicker = false;
		dateRangeOpen = false;
	}

	// Format date range for display
	const dateRangeDisplay = $derived(() => {
		if (selectedDateRange.start && selectedDateRange.end) {
			const start = new Date(selectedDateRange.start);
			const end = new Date(selectedDateRange.end);
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
		const totalPeople = peopleCount.adults + peopleCount.children + peopleCount.infants;
		goto(`/trips?adults=${peopleCount.adults}&children=${peopleCount.children}&infants=${peopleCount.infants}`);
		showPeopleSelector = false;
	}

	// Format people count for display
	const peopleCountDisplay = $derived(() => {
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
		goto(`/trips?budget=${selectedBudget}`);
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
		const option = budgetOptions.find(opt => opt.value === selectedBudget);
		return option?.label || '';
	});
</script>

<svelte:head>
	<title>여행찾기 - MatchTrip</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Filter Bar -->
	<div class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="container mx-auto px-4 py-2">
			<div class="scrollbar-hide flex gap-1.5 overflow-x-auto">
				<button
					onclick={openCitySearchModal}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.destination
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}">
					<span>여행지 {selectedCityIds.size > 0 ? `${selectedCityIds.size}곳` : uniqueDestinations > 0 ? `${uniqueDestinations}곳` : ''}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.destination ? 'brightness-0 invert' : ''}" />
				</button>
				<button
					onclick={openDateRangePicker}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.dates
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}">
					<span>{dateRangeDisplay() || '일정'}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.dates ? 'brightness-0 invert' : ''}" />
				</button>
				<button
					onclick={openPeopleSelector}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.people
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}">
					<span>{peopleCountDisplay() || '인원'}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.people ? 'brightness-0 invert' : ''}" />
				</button>
				<button
					onclick={openBudgetSelector}
					class="flex flex-shrink-0 items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all {selectedFilters.budget
						? 'border-gray-900 bg-gray-900 text-white'
						: 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400'}">
					<span>{budgetDisplay() || '예산'}</span>
					<img
						src={chevronRightIconUrl}
						alt=""
						class="h-3 w-3 {selectedFilters.budget ? 'brightness-0 invert' : ''}" />
				</button>
			</div>
		</div>
	</div>

	<!-- City Search Modal -->
	{#if showCitySearchModal}
		<div class="fixed inset-0 z-50 flex items-end justify-center">
			<!-- Backdrop -->
			<div 
				class="absolute inset-0 bg-black bg-opacity-50"
				onclick={() => showCitySearchModal = false}
			></div>
			
			<!-- Modal Content -->
			<div class="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-xl animate-slide-up h-[80vh] overflow-hidden">
				<CitySelector
					bind:this={citySelectorRef}
					selectedCities={selectedCityIds}
					onCityToggle={toggleCitySelection}
					onClose={() => showCitySearchModal = false}
					onSubmit={applyCityFilter}
					submitText={`${selectedCityIds.size}개 지역`}
					showBackButton={true}
				/>
				
				<!-- Bottom indicator for swipe -->
				<div class="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none">
					<div class="w-[134px] h-[5px] bg-[#052236] rounded-[100px]"></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Date Range Picker Modal -->
	{#if showDateRangePicker}
		<div class="fixed inset-0 z-50 flex items-end justify-center">
			<!-- Backdrop -->
			<div 
				class="absolute inset-0 bg-black bg-opacity-50"
				onclick={() => showDateRangePicker = false}
			></div>
			
			<!-- Modal Content -->
			<div class="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-xl animate-slide-up">
				<div class="px-6 pt-6 pb-8">
					<h2 class="text-lg font-semibold mb-6 text-center">여행 일정 선택</h2>
					
					<DateRangePicker.Root bind:value={selectedDateRange}>
						<!-- Calendar displayed directly -->
						<DateRangePicker.Calendar class="w-full">
							{#snippet children({ months, weekdays })}
								<DateRangePicker.Header class="mb-4 flex items-center justify-between px-4">
									<DateRangePicker.PrevButton
										class="inline-flex size-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
									>
										<CaretLeft class="size-5" />
									</DateRangePicker.PrevButton>
									<DateRangePicker.Heading class="text-base font-medium" />
									<DateRangePicker.NextButton
										class="inline-flex size-10 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
									>
										<CaretRight class="size-5" />
									</DateRangePicker.NextButton>
								</DateRangePicker.Header>
								
								<DateRangePicker.Grid class="w-full px-4">
									<DateRangePicker.GridHead>
										<DateRangePicker.GridRow class="mb-2 flex w-full justify-between">
											{#each weekdays as day}
												<DateRangePicker.HeadCell
													class="w-10 text-center text-sm font-medium text-gray-500"
												>
													{day.slice(0, 1)}
												</DateRangePicker.HeadCell>
											{/each}
										</DateRangePicker.GridRow>
									</DateRangePicker.GridHead>
									<DateRangePicker.GridBody>
										{#each months[0].weeks as weekDates}
											<DateRangePicker.GridRow class="flex w-full justify-between mb-1">
												{#each weekDates as date}
													<DateRangePicker.Cell
														{date}
														month={months[0].value}
														class="relative size-10 p-0 text-center"
													>
														<DateRangePicker.Day
															class="size-full rounded-lg text-sm text-gray-900 hover:bg-gray-100 transition-colors
																data-[selected]:bg-blue-500 data-[selected]:font-medium data-[selected]:text-white 
																data-[unavailable]:text-gray-300 data-[unavailable]:hover:bg-transparent
																data-[in-range]:bg-blue-100 data-[in-range]:text-gray-900
																data-[outside-month]:text-gray-400"
														>
															{date.day}
														</DateRangePicker.Day>
													</DateRangePicker.Cell>
												{/each}
											</DateRangePicker.GridRow>
										{/each}
									</DateRangePicker.GridBody>
								</DateRangePicker.Grid>
							{/snippet}
						</DateRangePicker.Calendar>

						<!-- Selected date display -->
						{#if selectedDateRange.start || selectedDateRange.end}
							<div class="mt-6 px-6 grid grid-cols-2 gap-4">
								<div>
									<label class="block text-xs text-gray-500 mb-1">출발일</label>
									<div class="text-sm font-medium">
										{selectedDateRange.start ? formatDate(selectedDateRange.start, { format: 'medium' }) : '-'}
									</div>
								</div>
								<div>
									<label class="block text-xs text-gray-500 mb-1">도착일</label>
									<div class="text-sm font-medium">
										{selectedDateRange.end ? formatDate(selectedDateRange.end, { format: 'medium' }) : '-'}
									</div>
								</div>
							</div>
						{/if}

						<div class="mt-6 px-6 grid grid-cols-2 gap-3">
							<button
								onclick={() => showDateRangePicker = false}
								class="py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
							>
								취소
							</button>
							<button
								onclick={applyDateFilter}
								disabled={!selectedDateRange.start || !selectedDateRange.end}
								class="py-3 rounded-xl font-medium transition-colors
									{selectedDateRange.start && selectedDateRange.end 
										? 'bg-blue-500 text-white hover:bg-blue-600' 
										: 'bg-gray-200 text-gray-400 cursor-not-allowed'}"
							>
								적용
							</button>
						</div>
					</DateRangePicker.Root>
				</div>
				
				<!-- Bottom indicator for swipe -->
				<div class="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none">
					<div class="w-[134px] h-[5px] bg-[#052236] rounded-[100px]"></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- People Selector Modal -->
	{#if showPeopleSelector}
		<div class="fixed inset-0 z-50 flex items-end justify-center">
			<!-- Backdrop -->
			<div 
				class="absolute inset-0 bg-black bg-opacity-50"
				onclick={() => showPeopleSelector = false}
			></div>
			
			<!-- Modal Content -->
			<div class="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-xl animate-slide-up">
				<div class="px-6 pt-6 pb-8">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-lg font-semibold">인원</h2>
						<button
							onclick={() => {
								// Reset to defaults
								peopleCount.adults = 2;
								peopleCount.children = 0;
								peopleCount.infants = 0;
							}}
							class="text-gray-400 hover:text-gray-600"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
					</div>
					
					<div class="space-y-6">
						<!-- Adults -->
						<div class="flex items-center justify-between">
							<div>
								<div class="font-medium text-gray-900">어른 {peopleCount.adults}명</div>
								<div class="text-sm text-gray-500">만 13세 이상</div>
							</div>
							<div class="flex items-center gap-3">
								<button
									onclick={() => decrementCount('adults')}
									disabled={peopleCount.adults <= 1}
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-colors
										{peopleCount.adults > 1 ? 'hover:bg-gray-100 text-gray-700' : 'opacity-50 cursor-not-allowed text-gray-400'}"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
								</button>
								<span class="w-8 text-center font-medium">{peopleCount.adults}</span>
								<button
									onclick={() => incrementCount('adults')}
									disabled={peopleCount.adults >= 10}
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-colors
										{peopleCount.adults < 10 ? 'hover:bg-gray-100 text-gray-700' : 'opacity-50 cursor-not-allowed text-gray-400'}"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
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
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-colors
										{peopleCount.children > 0 ? 'hover:bg-gray-100 text-gray-700' : 'opacity-50 cursor-not-allowed text-gray-400'}"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
								</button>
								<span class="w-8 text-center font-medium">{peopleCount.children}</span>
								<button
									onclick={() => incrementCount('children')}
									disabled={peopleCount.children >= 10}
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-colors
										{peopleCount.children < 10 ? 'hover:bg-gray-100 text-gray-700' : 'opacity-50 cursor-not-allowed text-gray-400'}"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
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
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-colors
										{peopleCount.infants > 0 ? 'hover:bg-gray-100 text-gray-700' : 'opacity-50 cursor-not-allowed text-gray-400'}"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
								</button>
								<span class="w-8 text-center font-medium">{peopleCount.infants}</span>
								<button
									onclick={() => incrementCount('infants')}
									disabled={peopleCount.infants >= 10}
									class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-colors
										{peopleCount.infants < 10 ? 'hover:bg-gray-100 text-gray-700' : 'opacity-50 cursor-not-allowed text-gray-400'}"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
								</button>
							</div>
						</div>
					</div>

					<div class="mt-8">
						<button
							onclick={applyPeopleFilter}
							class="w-full py-4 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
						>
							선택
						</button>
					</div>
				</div>
				
				<!-- Bottom indicator for swipe -->
				<div class="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none">
					<div class="w-[134px] h-[5px] bg-[#052236] rounded-[100px]"></div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Budget Selector Modal -->
	{#if showBudgetSelector}
		<div class="fixed inset-0 z-50 flex items-end justify-center">
			<!-- Backdrop -->
			<div 
				class="absolute inset-0 bg-black bg-opacity-50"
				onclick={() => showBudgetSelector = false}
			></div>
			
			<!-- Modal Content -->
			<div class="relative w-full max-w-lg bg-white rounded-t-[40px] shadow-xl animate-slide-up">
				<div class="px-6 pt-6 pb-8">
					<div class="flex items-center justify-between mb-6">
						<h2 class="text-lg font-semibold">예산</h2>
						<button
							onclick={() => showBudgetSelector = false}
							class="text-gray-400 hover:text-gray-600"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
					</div>
					
					<div class="space-y-3">
						{#each budgetOptions as option}
							<button
								onclick={() => selectedBudget = option.value}
								class="w-full flex items-center justify-between p-4 rounded-xl border transition-all
									{selectedBudget === option.value 
										? 'border-blue-500 bg-blue-50' 
										: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}"
							>
								<span class="text-base font-medium {selectedBudget === option.value ? 'text-blue-600' : 'text-gray-900'}">
									{option.label}
								</span>
								<div class="w-6 h-6 rounded-full border-2 flex items-center justify-center
									{selectedBudget === option.value 
										? 'border-blue-500 bg-blue-500' 
										: 'border-gray-300'}">
									{#if selectedBudget === option.value}
										<svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</div>
							</button>
						{/each}
					</div>

					<div class="mt-8">
						<button
							onclick={applyBudgetFilter}
							class="w-full py-4 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
						>
							선택
						</button>
					</div>
				</div>
				
				<!-- Bottom indicator for swipe -->
				<div class="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none">
					<div class="w-[134px] h-[5px] bg-[#052236] rounded-[100px]"></div>
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
						class="flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
						최신순
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7" />
						</svg>
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
							d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-medium text-gray-900">
					{#if userRole === 'guide'}
						현재 가이드할 수 있는 여행이 없습니다
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
						onclick={() => goto(`/trips/${trip.id}`)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								goto(`/trips/${trip.id}`);
							}
						}}
						class="w-full cursor-pointer overflow-hidden rounded-lg bg-white text-left shadow-sm transition-shadow hover:shadow-md">
						<div class="p-4">
							<div class="mb-3 flex items-start justify-between">
								<div class="flex-1">
									<div class="mb-1 flex items-center gap-2">
										<span
											class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium {getStatusInfo(
												trip.status
											).class}">
											{getStatusInfo(trip.status).label}
										</span>
									</div>
									<h3 class="mb-2 text-base font-semibold text-gray-900">
										{trip.destination.city}, {trip.destination.country}
									</h3>
								</div>
								<button
									onclick={(e) => e.stopPropagation()}
									class="text-gray-400 transition-colors hover:text-gray-600">
									<img src={bookmarkIconUrl} alt="Bookmark" class="h-5 w-5" />
								</button>
							</div>

							<div class="mb-3 space-y-1">
								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg
										class="h-4 w-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<span
										>{formatDateRange(trip.startDate, trip.endDate, {
											locale: $userLocale,
											timezone: $userTimezone,
											format: 'short'
										})}</span>
								</div>

								<div class="flex items-center gap-2 text-sm text-gray-600">
									<svg
										class="h-4 w-4 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
									</svg>
									<span
										>성인 {trip.adultsCount}명{#if trip.childrenCount > 0}
											아동 {trip.childrenCount}명{/if}</span>
								</div>
							</div>

							<div class="-mx-4 mb-4 px-4">
								<div class="scrollbar-hide flex gap-2 overflow-x-auto">
									<span
										class="inline-flex flex-shrink-0 items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
										200~500만원
									</span>
									<span
										class="inline-flex flex-shrink-0 items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
										{formatTravelMethod(trip.travelMethod)}
									</span>
									<span
										class="inline-flex flex-shrink-0 items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
										자연 / 아웃도어
									</span>
								</div>
							</div>

							<div class="border-t border-gray-100 pt-4">
								<details class="group">
									<summary
										class="flex cursor-pointer items-center justify-between text-sm font-medium text-gray-900">
										요청 사항
										<svg
											class="h-5 w-5 transition-transform group-open:rotate-180"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M19 9l-7 7-7-7" />
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
													class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
													자세히 보기
												</button>
											</div>
											<div>
												{#if trip.hasOffer}
													<p class="mb-2 text-xs text-gray-500">지원한 보기</p>
													<button
														onclick={(e) => {
															e.stopPropagation();
															goto(`/conversations/${trip.conversationId}`);
														}}
														class="w-full rounded-lg bg-[#2B2D5B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2147]">
														제안하기
													</button>
												{:else}
													<p class="mb-2 text-xs text-gray-500">&nbsp;</p>
													<button
														onclick={(e) => {
															e.stopPropagation();
															goToOffer(trip.id);
														}}
														disabled={navigatingTripId === trip.id}
														class="w-full rounded-lg bg-[#2B2D5B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2147] disabled:cursor-not-allowed disabled:opacity-50">
														{#if navigatingTripId === trip.id}
															로딩중...
														{:else}
															제안하기
														{/if}
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
</style>

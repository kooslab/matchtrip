<script lang="ts">
	import { DateRangePicker } from 'bits-ui';
	import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import { goto, invalidate } from '$app/navigation';
	import { useSession } from '$lib/authClient';
	import { tripForm } from '$lib/stores/tripForm';

	// Authentication check
	const session = useSession();

	// Check if user is authenticated, redirect to signin if not
	$effect(() => {
		if (!$session.isPending && !$session.data) {
			goto('/signin');
		}
	});


	// Debug dropdown visibility
	$effect(() => {
		console.log('Dropdown visibility changed:', showDropdown, 'Results count:', results.length);
	});

	// Add click outside listener
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
				clearTimeout(debounceTimeout);
			};
		}
	});

	let children = $state(0);
	let additionalRequests = $state('');
	let calendarOpen = $state(false);

	// Destination search state
	let results: any[] = $state([]);
	let loading = false;
	let showDropdown = $state(false);
	let debounceTimeout: ReturnType<typeof setTimeout>;

	// Form submission state
	let isSubmitting = $state(false);

	let selectedCity = $state<any>(undefined);

	function goBack() {
		goto('/');
	}

	function handleAIRecommendation() {
		// Handle AI recommendation logic
		console.log('AI 추천 일정 만들기');
	}

	async function handleExpertProposal() {
		// Check authentication before proceeding
		if (!$session.data) {
			alert('로그인이 필요합니다.');
			goto('/signin');
			return;
		}

		// Get current form values
		const formData = $tripForm;

		// Validate form data
		if (
			!formData.selectedCity ||
			!formData.selectedCity.id ||
			!formData.selectedCity.city ||
			!formData.selectedCity.country ||
			!formData.dateRange.start ||
			!formData.dateRange.end ||
			!formData.people ||
			!formData.tourType
		) {
			alert('필수 항목을 모두 입력해주세요.');
			return;
		}

		isSubmitting = true;

		const travelMethodMap: Record<string, string> = {
			도보: 'walking',
			자동차: 'driving',
			대중교통: 'public_transport',
			자전거: 'bike',
			'도보+대중교통': 'walking+public_transport',
			'도보+자전거': 'walking+bike',
			'도보+자동차': 'walking+driving'
		};

		try {
			const requestBody = {
				destination: {
					id: formData.selectedCity.id,
					city: formData.selectedCity.city,
					country: formData.selectedCity.country
				},
				adultsCount: formData.people,
				childrenCount: children,
				startDate: formData.dateRange.start
					? (() => {
						const date = formData.dateRange.start;
						if (date.year && date.month && date.day) {
							return new Date(date.year, date.month - 1, date.day).toISOString();
						}
						return new Date(date.toString()).toISOString();
					})()
					: '',
				endDate: formData.dateRange.end
					? (() => {
						const date = formData.dateRange.end;
						if (date.year && date.month && date.day) {
							return new Date(date.year, date.month - 1, date.day).toISOString();
						}
						return new Date(date.toString()).toISOString();
					})()
					: '',
				travelMethod: travelMethodMap[formData.tourType] || null,
				customRequest: additionalRequests || null
			};

			console.log('Sending trip request:', requestBody);

			const response = await fetch('/api/trips', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(requestBody)
			});

			const data = await response.json();
			console.log('Response:', response.status, data);

			if (response.ok && data.trip) {
				alert('여행 전문가 제안 요청이 성공적으로 등록되었습니다!');
				// Invalidate the trips cache before navigating
				await invalidate('app:trips');
				goto('/my-trips');
			} else {
				if (response.status === 401) {
					alert('로그인이 필요합니다.');
					goto('/signin');
				} else {
					console.error('Server error:', data);
					alert(`오류가 발생했습니다: ${data.error || '알 수 없는 오류'}`);
				}
			}
		} catch (error) {
			console.error('Error creating trip:', error);
			console.error('Error details:', error.message, error.stack);
			alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
		} finally {
			isSubmitting = false;
		}
	}

	// Destination search functions
	async function fetchResults(q: string) {
		if (!q) {
			results = [];
			showDropdown = false;
			return;
		}
		loading = true;
		console.log('Searching for:', q);
		try {
			const res = await fetch(`/api/destinations?q=${encodeURIComponent(q)}`);
			console.log('Response status:', res.status);
			const data = await res.json();
			console.log('Response data:', data);
			results = data.results || [];
			// Force show dropdown if we have results
			if (results.length > 0) {
				showDropdown = true;
				console.log('FORCING showDropdown to true, results length:', results.length);
			} else {
				showDropdown = false;
				console.log('No results, hiding dropdown');
			}
		} catch (error) {
			console.error('Error fetching destinations:', error);
			results = [];
			showDropdown = false;
		}
		loading = false;
	}

	function handleDestinationInput(e: Event) {
		const target = e.target as HTMLInputElement;
		tripForm.update((f) => ({ ...f, search: target.value, selectedCity: undefined }));
		selectedCity = undefined;
		clearTimeout(debounceTimeout);

		if (!target.value.trim()) {
			results = [];
			showDropdown = false;
			return;
		}

		debounceTimeout = setTimeout(() => fetchResults(target.value), 300);
	}

	function handleDestinationSelect(cityObj: any) {
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

	function handleClickOutside(e: Event) {
		const target = e.target as HTMLElement;
		if (!target.closest('.destination-search')) {
			console.log('Click outside detected, hiding dropdown');
			showDropdown = false;
		}
	}

	// Helper function to format dates
	function formatDate(date: any) {
		if (!date) return '';
		const d = new Date(date.year, date.month - 1, date.day);
		const year = d.getFullYear();
		const month = d.getMonth() + 1;
		const day = d.getDate();
		const days = ['일', '월', '화', '수', '목', '금', '토'];
		const dayOfWeek = days[d.getDay()];
		return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')} (${dayOfWeek})`;
	}
</script>

{#if $session.isPending}
	<div class="flex min-h-screen items-center justify-center">
		<p class="text-lg text-gray-600">로딩 중...</p>
	</div>
{:else if !$session.data}
	<div class="flex min-h-screen items-center justify-center">
		<p class="text-lg text-gray-600">로그인이 필요합니다. 잠시 후 로그인 페이지로 이동합니다...</p>
	</div>
{:else}
	<div class="flex min-h-screen flex-col bg-white">
		<!-- Page Title -->
		<div class="px-4 py-4">
			<h1 class="text-xl font-bold text-gray-900">여행만들기</h1>
		</div>

		<!-- Trip Creation Form -->
		<section class="flex-1 px-4 py-6">
			<form class="space-y-6">
				<!-- Destination -->
				<div class="space-y-2">
					<label for="destination" class="block text-sm font-medium text-gray-700">
						여행지<span class="text-red-500">*</span>
					</label>
					<div class="destination-search relative">
						<input
							id="destination"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-pink-200 focus:outline-none"
							value={$tripForm.search}
							oninput={handleDestinationInput}
							onfocus={() => {
								if (results.length) {
									showDropdown = true;
								}
							}}
							placeholder="여행지를 입력하세요"
							autocomplete="off"
							readonly={$tripForm.selectedCity &&
								$tripForm.selectedCity.city === $tripForm.search} />

						{#if $tripForm.selectedCity && $tripForm.selectedCity.city === $tripForm.search}
							<button
								type="button"
								class="absolute top-2 right-2 text-xs text-pink-500 underline"
								onclick={resetCitySelection}>
								변경
							</button>
						{/if}

						{#if showDropdown}
							<ul
								class="absolute right-0 left-0 z-50 mt-1 max-h-60 overflow-auto rounded-lg border bg-white shadow-lg">
								{#each results as dest}
									<button
										type="button"
										class="flex w-full cursor-pointer justify-between px-4 py-3 text-base text-gray-700 hover:bg-pink-50"
										onmousedown={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handleDestinationSelect(dest);
										}}>
										<span>{dest.city}</span>
										<span class="text-gray-400">{dest.country}</span>
									</button>
								{/each}
							</ul>
						{/if}
					</div>
				</div>

				<!-- Date Range -->
				<div class="space-y-2">
					<label for="dateRange" class="block text-sm font-medium text-gray-700">
						날짜<span class="text-red-500">*</span>
					</label>
					<div class="relative">
						<DateRangePicker.Root
							value={$tripForm.dateRange}
							onValueChange={(val) => tripForm.update((f) => ({ ...f, dateRange: val }))}
							open={calendarOpen}
							onOpenChange={(open) => {
								calendarOpen = open;
							}}
							closeOnRangeSelect={false}
							weekdayFormat="short"
							fixedWeeks={true}
							granularity="day"
							class="w-full">
							{#if !calendarOpen}
								<!-- Clean button UI when calendar is closed -->
								<button
									type="button"
									onclick={() => calendarOpen = true}
									class="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-base hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-200">
									<span class="text-gray-700">
										{#if $tripForm.dateRange.start && $tripForm.dateRange.end}
											{formatDate($tripForm.dateRange.start)} ~ {formatDate($tripForm.dateRange.end)}
										{:else}
											<span class="text-gray-400">여행 날짜를 선택하세요</span>
										{/if}
									</span>
									<CalendarBlank class="size-5 text-gray-400" />
								</button>
								<!-- Hidden inputs for date picker functionality -->
								<div class="hidden">
									{#each ['start', 'end'] as type (type)}
										<DateRangePicker.Input type={type as 'start' | 'end'}>
											{#snippet children({ segments })}
												{#each segments as segment}
													<DateRangePicker.Segment part={segment.part} class="hidden">
														{segment.value}
													</DateRangePicker.Segment>
												{/each}
											{/snippet}
										</DateRangePicker.Input>
									{/each}
								</div>
							{:else}
								<!-- Full date picker UI when calendar is open -->
								<div
									class="flex w-full items-center rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm">
									{#each ['start', 'end'] as type (type)}
										<div class="flex items-center whitespace-nowrap">
											<DateRangePicker.Input type={type as 'start' | 'end'}>
												{#snippet children({ segments })}
													{@const yearSegment = segments.find((s) => s.part === 'year')}
													{@const monthSegment = segments.find((s) => s.part === 'month')}
													{@const daySegment = segments.find((s) => s.part === 'day')}
													{@const getKoreanDayOfWeek = () => {
														if (!yearSegment || !monthSegment || !daySegment) return '';
														const date = new Date(
															parseInt(yearSegment.value),
															parseInt(monthSegment.value) - 1,
															parseInt(daySegment.value)
														);
														const days = ['일', '월', '화', '수', '목', '금', '토'];
														return days[date.getDay()];
													}}

													{#if yearSegment}
														<DateRangePicker.Segment
															part="year"
															class="rounded px-0.5 py-1 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
															>{yearSegment.value}</DateRangePicker.Segment>
														<span class="text-gray-400">.</span>
													{/if}
													{#if monthSegment}
														<DateRangePicker.Segment
															part="month"
															class="rounded px-0.5 py-1 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
															>{monthSegment.value}</DateRangePicker.Segment>
														<span class="text-gray-400">.</span>
													{/if}
													{#if daySegment}
														<DateRangePicker.Segment
															part="day"
															class="rounded px-0.5 py-1 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
															>{daySegment.value}</DateRangePicker.Segment>
													{/if}
													{#if yearSegment && monthSegment && daySegment}
														<span class="ml-1 text-xs text-gray-400">({getKoreanDayOfWeek()})</span>
													{/if}
												{/snippet}
											</DateRangePicker.Input>
										</div>
										{#if type === 'start'}
											<div aria-hidden="true" class="px-2 text-gray-400">~</div>
										{/if}
									{/each}
									<DateRangePicker.Trigger
										class="ml-auto inline-flex size-8 items-center justify-center rounded text-gray-400 transition-all hover:bg-gray-100">
										<CalendarBlank class="size-5" />
									</DateRangePicker.Trigger>
								</div>
							{/if}
							<DateRangePicker.Content>
								<DateRangePicker.Calendar class="mr-6 rounded-lg border bg-white p-4 shadow-lg">
									{#snippet children({ months, weekdays })}
										<DateRangePicker.Header class="mb-4 flex items-center justify-between">
											<DateRangePicker.PrevButton
												class="inline-flex size-8 items-center justify-center rounded hover:bg-gray-100">
												<CaretLeft class="size-4" />
											</DateRangePicker.PrevButton>
											<DateRangePicker.Heading class="text-base font-medium" />
											<DateRangePicker.NextButton
												class="inline-flex size-8 items-center justify-center rounded hover:bg-gray-100">
												<CaretRight class="size-4" />
											</DateRangePicker.NextButton>
										</DateRangePicker.Header>
										<DateRangePicker.Grid class="w-full border-collapse space-y-1 select-none">
											<DateRangePicker.GridHead>
												<DateRangePicker.GridRow class="mb-2 flex w-full justify-between">
													{#each weekdays as day}
														<DateRangePicker.HeadCell
															class="w-9 text-center text-xs font-normal text-gray-400">
															<div>{day.slice(0, 2)}</div>
														</DateRangePicker.HeadCell>
													{/each}
												</DateRangePicker.GridRow>
											</DateRangePicker.GridHead>
											<DateRangePicker.GridBody>
												{#each months[0].weeks as weekDates}
													<DateRangePicker.GridRow class="flex w-full">
														{#each weekDates as date}
															<DateRangePicker.Cell
																{date}
																month={months[0].value}
																class="relative m-0 size-9 p-0 text-center text-sm">
																<DateRangePicker.Day
																	class="rounded text-gray-900 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-pink-500 data-selected:bg-pink-100 data-selected:font-medium data-selected:text-pink-900 data-unavailable:text-gray-300">
																	{date.day}
																</DateRangePicker.Day>
															</DateRangePicker.Cell>
														{/each}
													</DateRangePicker.GridRow>
												{/each}
											</DateRangePicker.GridBody>
										</DateRangePicker.Grid>
										<div class="mt-4 flex justify-end">
											<button
												type="button"
												class="rounded-lg bg-pink-500 px-4 py-2 text-sm text-white hover:bg-pink-600"
												onclick={() => {
													calendarOpen = false;
												}}>확인</button>
										</div>
									{/snippet}
								</DateRangePicker.Calendar>
							</DateRangePicker.Content>
						</DateRangePicker.Root>
					</div>
				</div>

				<!-- People Count -->
				<div class="space-y-2">
					<label for="people" class="block text-sm font-medium text-gray-700">
						인원<span class="text-red-500">*</span>
					</label>
					<div class="space-y-3">
						<!-- Adults -->
						<div
							class="flex items-center justify-between rounded-lg border border-gray-300 px-4 py-3">
							<span class="text-base text-gray-700">성인</span>
							<div class="flex items-center gap-3">
								<button
									type="button"
									class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-lg hover:bg-gray-200"
									onclick={() =>
										tripForm.update((f) => ({ ...f, people: Math.max(1, f.people - 1) }))}
									disabled={$tripForm.people <= 1}>-</button>
								<span class="w-8 text-center text-base">{$tripForm.people}</span>
								<button
									type="button"
									class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-lg hover:bg-gray-200"
									onclick={() => tripForm.update((f) => ({ ...f, people: f.people + 1 }))}
									>+</button>
							</div>
						</div>

						<!-- Children -->
						<div
							class="flex items-center justify-between rounded-lg border border-gray-300 px-4 py-3">
							<span class="text-base text-gray-700">유아 (8세 이하)</span>
							<div class="flex items-center gap-3">
								<button
									type="button"
									class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-lg hover:bg-gray-200"
									onclick={() => {
										children = Math.max(0, children - 1);
									}}
									disabled={children <= 0}>-</button>
								<span class="w-8 text-center text-base">{children}</span>
								<button
									type="button"
									class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-lg hover:bg-gray-200"
									onclick={() => {
										children = children + 1;
									}}>+</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Tour Method -->
				<div class="space-y-2">
					<label for="tourType" class="block text-sm font-medium text-gray-700">
						투어방법<span class="text-red-500">*</span>
					</label>
					<select
						id="tourType"
						class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:ring-2 focus:ring-pink-200 focus:outline-none"
						value={$tripForm.tourType}
						onchange={(e) =>
							tripForm.update((f) => ({
								...f,
								tourType: (e.target as HTMLSelectElement).value
							}))}>
						<option value="" disabled selected>여행 방법을 선택하세요</option>
						<option value="도보">도보</option>
						<option value="자동차">자동차</option>
						<option value="대중교통">대중교통</option>
						<option value="도보+대중교통">도보+대중교통</option>
						<option value="자전거">자전거</option>
					</select>
				</div>

				<!-- Additional Requests -->
				<div class="space-y-2">
					<label for="additionalRequests" class="block text-sm font-medium text-gray-700">
						기타 요청사항<span class="text-red-500">*</span>
					</label>
					<textarea
						id="additionalRequests"
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-pink-200 focus:outline-none"
						rows="4"
						bind:value={additionalRequests}
						placeholder="추가 요청사항을 입력하세요"></textarea>
				</div>
			</form>

			<!-- Action Buttons -->
			<div class="mt-8 flex gap-4">
				<button
					class="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
					onclick={handleAIRecommendation}>
					AI 추천 일정<br />만들기
				</button>
				<button
					class="flex-1 rounded-lg bg-pink-500 px-6 py-3 text-base font-medium text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
					onclick={handleExpertProposal}
					disabled={isSubmitting}>
					{#if isSubmitting}
						<div class="flex items-center justify-center gap-2">
							<div
								class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent">
							</div>
							<span>제출 중...</span>
						</div>
					{:else}
						여행 전문가<br />제안받기
					{/if}
				</button>
			</div>
		</section>
	</div>
{/if}
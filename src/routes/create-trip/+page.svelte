<script lang="ts">
	import { DateRangePicker } from 'bits-ui';
	import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	import { goto } from '$app/navigation';

	let destination = '';
	let dateRange = { start: undefined, end: undefined };
	let adults = 2;
	let children = 0;
	let tourMethod = '';
	let additionalRequests = '';
	let calendarOpen = false;

	// Destination search state
	let results: any[] = [];
	let loading = false;
	let showDropdown = false;
	let debounceTimeout: ReturnType<typeof setTimeout>;

	function goBack() {
		goto('/');
	}

	function handleAIRecommendation() {
		// Handle AI recommendation logic
		console.log('AI 추천 일정 만들기');
	}

	function handleExpertProposal() {
		// Handle expert proposal logic
		console.log('여행 전문가 제안받기');
	}

	// Destination search functions
	async function fetchResults(q: string) {
		if (!q) {
			results = [];
			showDropdown = false;
			return;
		}
		loading = true;
		const res = await fetch(`/api/destinations?q=${encodeURIComponent(q)}`);
		const data = await res.json();
		results = data.results;
		showDropdown = results.length > 0;
		loading = false;
	}

	function handleDestinationInput(e: Event) {
		const target = e.target as HTMLInputElement;
		destination = target.value;
		clearTimeout(debounceTimeout);

		// Hide dropdown immediately if input is empty
		if (!destination.trim()) {
			results = [];
			showDropdown = false;
			return;
		}

		debounceTimeout = setTimeout(() => fetchResults(destination), 200);
	}

	function handleDestinationSelect(city: string) {
		destination = city;
		showDropdown = false;
	}

	function handleClickOutside(e: Event) {
		const target = e.target as HTMLElement;
		if (!target.closest('.destination-search')) {
			showDropdown = false;
		}
	}
</script>

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
				<label class="block text-sm font-medium text-gray-700">
					여행지<span class="text-red-500">*</span>
				</label>
				<div class="destination-search relative">
					<input
						class="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:ring-2 focus:ring-pink-200 focus:outline-none"
						value={destination}
						oninput={handleDestinationInput}
						onfocus={() => {
							if (results.length) showDropdown = true;
						}}
						onblur={() => {
							// Hide dropdown when input loses focus
							showDropdown = false;
						}}
						placeholder="여행지를 입력하세요"
						autocomplete="off" />
					{#if showDropdown}
						<ul
							class="absolute right-0 left-0 z-10 mt-1 max-h-60 overflow-auto rounded-lg border bg-white shadow-lg">
							{#each results as dest}
								<li
									class="flex cursor-pointer justify-between px-4 py-3 text-base text-gray-700 hover:bg-pink-50"
									onmousedown={(e) => e.preventDefault()}
									onclick={() => handleDestinationSelect(dest.city)}>
									<span>{dest.city}</span>
									<span class="text-gray-400">{dest.country}</span>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>

			<!-- Date Range -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-gray-700">
					날짜<span class="text-red-500">*</span>
				</label>
				<div class="relative">
					<DateRangePicker.Root
						bind:value={dateRange}
						bind:open={calendarOpen}
						weekdayFormat="short"
						fixedWeeks={true}
						class="w-full">
						<div
							class="flex w-full items-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-base">
							{#each ['start', 'end'] as type (type)}
								<DateRangePicker.Input type={type as 'start' | 'end'}>
									{#snippet children({ segments })}
										{#each segments as { part, value }}
											<div class="inline-block select-none">
												{#if part === 'literal'}
													<DateRangePicker.Segment {part} class="p-1 text-gray-400"
														>{value}</DateRangePicker.Segment>
												{:else}
													<DateRangePicker.Segment
														{part}
														class="rounded px-1 py-1 hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0"
														>{value}</DateRangePicker.Segment>
												{/if}
											</div>
										{/each}
									{/snippet}
								</DateRangePicker.Input>
								{#if type === 'start'}
									<div aria-hidden="true" class="px-1 text-gray-400">~</div>
								{/if}
							{/each}
							<DateRangePicker.Trigger
								class="ml-auto inline-flex size-8 items-center justify-center rounded text-gray-400 transition-all hover:bg-gray-100">
								<CalendarBlank class="size-6" />
							</DateRangePicker.Trigger>
						</div>
						<DateRangePicker.Content
							style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;">
							<DateRangePicker.Calendar
								style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); max-width: 400px; width: 90vw;">
								{#snippet children({ months, weekdays })}
									<DateRangePicker.Header class="mb-4 flex items-center justify-between">
										<DateRangePicker.PrevButton
											class="inline-flex size-10 items-center justify-center rounded hover:bg-gray-100">
											<CaretLeft class="size-6" />
										</DateRangePicker.PrevButton>
										<DateRangePicker.Heading class="text-lg font-medium" />
										<DateRangePicker.NextButton
											class="inline-flex size-10 items-center justify-center rounded hover:bg-gray-100">
											<CaretRight class="size-6" />
										</DateRangePicker.NextButton>
									</DateRangePicker.Header>
									<DateRangePicker.Grid class="w-full border-collapse space-y-1 select-none">
										<DateRangePicker.GridHead>
											<DateRangePicker.GridRow class="mb-2 flex w-full justify-between">
												{#each weekdays as day}
													<DateRangePicker.HeadCell
														class="w-10 text-center text-xs font-normal text-gray-400">
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
															class="relative m-0 size-10 p-0 text-center text-sm">
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
									<div class="mt-6 flex justify-end">
										<button
											type="button"
											class="rounded-lg bg-pink-500 px-6 py-2 text-white hover:bg-pink-600"
											onclick={() => (calendarOpen = false)}>확인</button>
									</div>
								{/snippet}
							</DateRangePicker.Calendar>
						</DateRangePicker.Content>
					</DateRangePicker.Root>
				</div>
			</div>

			<!-- People Count -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-gray-700">
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
								onclick={() => {
									adults = Math.max(1, adults - 1);
								}}
								disabled={adults <= 1}>-</button>
							<span class="w-8 text-center text-base">{adults}</span>
							<button
								type="button"
								class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 text-lg hover:bg-gray-200"
								onclick={() => {
									adults = adults + 1;
								}}>+</button>
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
				<label class="block text-sm font-medium text-gray-700">
					투어방법<span class="text-red-500">*</span>
				</label>
				<select
					class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base focus:ring-2 focus:ring-pink-200 focus:outline-none"
					bind:value={tourMethod}>
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
				<label class="block text-sm font-medium text-gray-700">
					기타 요청사항<span class="text-red-500">*</span>
				</label>
				<textarea
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
				class="flex-1 rounded-lg bg-pink-500 px-6 py-3 text-base font-medium text-white hover:bg-pink-600"
				onclick={handleExpertProposal}>
				여행 전문가<br />제안받기
			</button>
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t py-4 text-center text-sm text-gray-600">푸터</footer>
</div>

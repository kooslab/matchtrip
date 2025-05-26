<script lang="ts">
	let menuOpen = false;
	let search = '';
	let results: any[] = [];
	let loading = false;
	let showDropdown = false;
	let debounceTimeout: ReturnType<typeof setTimeout>;
	let calendarOpen = false;

	import { DateRangePicker } from 'bits-ui';
	import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	let dateRange = { start: undefined, end: undefined };
	let people = 1;
	let tourType = '';

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

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		search = target.value;
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => fetchResults(search), 200);
	}

	function handleSelect(city: string) {
		search = city;
		showDropdown = false;
	}

	function handleSearch(event: Event) {
		event.preventDefault();
		// handle search logic here
	}
</script>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Header -->
	<header class="relative flex items-center justify-center border-b px-4 py-3">
		<span class="rounded bg-gray-100 px-4 py-2 text-xl font-semibold">매치트립 로고</span>
	</header>

	<!-- Search Bar -->
	<section class="px-4 py-3">
		<form
			class="flex flex-col gap-4 rounded-xl border bg-white px-2 py-4 shadow-sm"
			onsubmit={handleSearch}>
			<!-- Row 1: Destination -->
			<div class="flex w-full flex-col gap-1">
				<div class="flex items-center gap-4">
					<label class="shrink-0 text-sm font-medium text-gray-700">어디로 가고 싶으신가요?</label>
					<div class="relative min-w-0 flex-1">
						<input
							class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-pink-200 focus:outline-none"
							placeholder="여행지"
							value={search}
							oninput={handleInput}
							onfocus={() => {
								if (results.length) showDropdown = true;
							}}
							autocomplete="off" />
						{#if showDropdown}
							<ul
								class="absolute right-0 left-0 z-10 mt-1 max-h-60 overflow-auto rounded-xl border bg-white shadow-lg">
								{#each results as dest}
									<li
										class="flex cursor-pointer justify-between px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
										onclick={() => handleSelect(dest.city)}>
										<span>{dest.city}</span>
										<span class="text-gray-400">{dest.country}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</div>
			</div>

			<!-- Row 2: Date Range Picker -->
			<div class="flex w-full flex-col gap-1">
				<label class="mb-1 text-sm font-medium text-gray-700">여행 날짜</label>
				<div class="relative min-w-0 flex-1">
					<DateRangePicker.Root
						bind:value={dateRange}
						bind:open={calendarOpen}
						weekdayFormat="short"
						fixedWeeks={true}
						class="w-full">
						<div
							class="flex w-full items-center rounded-xl border border-gray-300 bg-white px-2 py-3 text-sm">
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
									<div aria-hidden="true" class="px-1 text-gray-400">–</div>
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

			<!-- Row 3: People and Tour Type -->
			<div class="flex w-full items-center gap-3">
				<!-- Number of People with Label -->
				<div class="flex items-center gap-2">
					<label class="text-sm font-medium whitespace-nowrap text-gray-700">인원 수</label>
					<button
						type="button"
						class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 p-2 text-lg"
						onclick={() => {
							people = Math.max(1, people - 1);
						}}
						aria-label="인원수 감소">-</button>
					<input
						class="w-12 border-none text-center text-sm focus:ring-0"
						type="number"
						min="1"
						bind:value={people}
						placeholder="인원수"
						readonly />
					<button
						type="button"
						class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 p-2 text-lg"
						onclick={() => {
							people = people + 1;
						}}
						aria-label="인원수 증가">+</button>
				</div>

				<!-- Tour Type Dropdown -->
				<div class="flex-1">
					<select
						class="w-full rounded border-none bg-gray-50 py-2 text-center text-sm focus:ring-0"
						bind:value={tourType}>
						<option value="" disabled selected>여행 방법</option>
						<option value="도보">도보</option>
						<option value="자동차">자동차</option>
						<option value="대중교통">대중교통</option>
					</select>
				</div>

				<!-- Search Button -->
				<button
					type="submit"
					class="flex shrink-0 items-center justify-center rounded-full bg-pink-500 p-2 text-white"
					style="min-width: 40px; min-height: 40px;">
					<svg
						class="h-5 w-5"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						viewBox="0 0 24 24">
						<circle cx="11" cy="11" r="8" />
						<line x1="21" y1="21" x2="16.65" y2="16.65" />
					</svg>
				</button>
			</div>
		</form>
	</section>

	<!-- Branding Video Section -->
	<section class="flex flex-1 items-center justify-center border-t border-b py-12">
		<span class="text-lg">브랜딩 영상</span>
	</section>

	<!-- Intro Section -->
	<section class="border-b px-4 py-8 text-center">
		<div class="mb-2 text-2xl font-bold text-gray-700">
			<span class="font-extrabold text-gray-900">Match Trip</span>은
		</div>
		<div class="text-base text-gray-500">
			나에게 맞는 현지 여행 전문가를<br />
			안전하게 연결해주는 공간입니다.
		</div>
		<div class="mx-auto mt-2 w-1/2 border-t"></div>
	</section>

	<!-- Footer -->
	<footer class="py-4 text-center text-sm text-gray-600">푸터</footer>
</div>

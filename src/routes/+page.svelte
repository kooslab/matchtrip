<script lang="ts">
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

	// Carousel state
	let currentSlide = $state(0);
	let startX = $state(0);
	let isDragging = $state(false);

	const slides = [
		{
			title: '검색',
			description: '여행지,\n날짜,\n인원수를\n입력하세요',
			bgColor: 'bg-pink-100'
		},
		{
			title: '트립AI 추천',
			description: 'AI가 여행\n스케줄을\n만들어줘요',
			bgColor: 'bg-blue-100'
		},
		{
			title: '여행제안',
			description: '현지\n여행전문가\n들이 제안을\n해요',
			bgColor: 'bg-green-100'
		},
		{
			title: '여행 채팅',
			description: '나에게\n맞는\n여행전문가\n를 채팅하세요',
			bgColor: 'bg-yellow-100'
		},
		{
			title: '안전결제',
			description: '안전결제로\n안전하게\n결제하고\n예약을\n완료합니다',
			bgColor: 'bg-purple-100'
		},
		{
			title: '여행 및 리뷰',
			description: '여행전문가와\n함께\n프라이빗한\n여행을 즐기고\n리뷰도\n남겨보세요.',
			bgColor: 'bg-orange-100'
		}
	];

	function nextSlide() {
		currentSlide = (currentSlide + 1) % slides.length;
	}

	function prevSlide() {
		currentSlide = (currentSlide - 1 + slides.length) % slides.length;
	}

	function goToSlide(index: number) {
		currentSlide = index;
	}

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		isDragging = true;
	}

	function handleTouchEnd(e: TouchEvent) {
		if (!isDragging) return;

		const endX = e.changedTouches[0].clientX;
		const diffX = startX - endX;

		// Minimum swipe distance
		if (Math.abs(diffX) > 50) {
			if (diffX > 0) {
				nextSlide();
			} else {
				prevSlide();
			}
		}

		isDragging = false;
	}

	function handleMouseDown(e: MouseEvent) {
		startX = e.clientX;
		isDragging = true;
	}

	function handleMouseUp(e: MouseEvent) {
		if (!isDragging) return;

		const endX = e.clientX;
		const diffX = startX - endX;

		// Minimum swipe distance
		if (Math.abs(diffX) > 50) {
			if (diffX > 0) {
				nextSlide();
			} else {
				prevSlide();
			}
		}

		isDragging = false;
	}

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
		loading = true;

		// Abort previous fetch if it exists
		if (fetchController) {
			fetchController.abort();
		}
		fetchController = new AbortController();

		try {
			const res = await fetch(`/api/destinations?q=${encodeURIComponent(q)}`, {
				signal: fetchController.signal
			});
			const data = await res.json();
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
							value={$tripForm.search}
							oninput={handleInput}
							onfocus={() => {
								if (results.length) showDropdown = true;
							}}
							onblur={handleBlur}
							onkeydown={handleKeydown}
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
								class="absolute right-0 left-0 z-10 mt-1 max-h-60 overflow-auto rounded-xl border bg-white shadow-lg">
								{#if loading}
									<li class="p-2 text-center text-sm text-gray-400">검색 중...</li>
								{/if}
								{#each results as dest}
									<li
										class="flex cursor-pointer justify-between px-4 py-2 text-sm text-gray-700 hover:bg-pink-50"
										onmousedown={() => handleSelect(dest)}>
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
				<!-- <label class="mb-1 text-sm font-medium text-gray-700">여행 날짜</label> -->
				<div class="relative min-w-0 flex-1">
					<DateRangePicker.Root
						bind:value={$tripForm.dateRange}
						onValueChange={handleDateRangeChange}
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
							tripForm.update((f) => ({ ...f, people: Math.max(1, f.people - 1) }));
						}}
						aria-label="인원수 감소">-</button>
					<input
						class="w-12 border-none text-center text-sm focus:ring-0"
						type="number"
						min="1"
						value={$tripForm.people}
						onchange={(e) =>
							tripForm.update((f) => ({
								...f,
								people: Number((e.target as HTMLInputElement).value)
							}))}
						placeholder="인원수"
						readonly />
					<button
						type="button"
						class="flex h-8 w-8 items-center justify-center rounded bg-gray-100 p-2 text-lg"
						onclick={() => {
							tripForm.update((f) => ({ ...f, people: f.people + 1 }));
						}}
						aria-label="인원수 증가">+</button>
				</div>

				<!-- Tour Type Dropdown -->
				<div class="flex-1">
					<select
						class="w-full rounded border-none bg-gray-50 py-2 text-center text-sm focus:ring-0"
						value={$tripForm.tourType}
						onchange={(e) =>
							tripForm.update((f) => ({ ...f, tourType: (e.target as HTMLSelectElement).value }))}>
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
					<Plus size={20} />
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

	<!-- Onboarding Section -->
	<section class="border-b bg-gray-50 px-4 py-12">
		<div class="mx-auto max-w-4xl">
			<div class="mb-8 text-center">
				<h2 class="mb-4 text-3xl font-bold text-gray-900">Match Trip 사용방법</h2>
				<p class="text-lg text-gray-600">간단한 단계로 완벽한 여행을 계획하세요</p>
			</div>

			<!-- Carousel Container -->
			<div class="relative overflow-hidden">
				<!-- Mobile Screen Carousel -->
				<div
					class="flex cursor-grab transition-transform duration-300 ease-in-out active:cursor-grabbing"
					style="transform: translateX(-{currentSlide * 100}%)"
					ontouchstart={handleTouchStart}
					ontouchend={handleTouchEnd}
					onmousedown={handleMouseDown}
					onmouseup={handleMouseUp}>
					{#each slides as slide, index}
						<div class="flex w-full flex-shrink-0 justify-center">
							<div class="flex flex-col items-center">
								<div
									class="mb-4 h-96 w-56 rounded-3xl border-4 border-gray-800 bg-white p-4 shadow-xl">
									<div class="mb-4 h-6 w-full rounded-full bg-gray-900"></div>
									<div class="space-y-4">
										<div class="text-center">
											<h3 class="text-lg font-bold text-gray-900">{slide.title}</h3>
											<p class="mt-2 text-sm whitespace-pre-line text-gray-600">
												{slide.description}
											</p>
										</div>
										<div class="mx-auto h-32 w-32 rounded-lg {slide.bgColor}"></div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Navigation Arrows -->
				<button
					class="absolute top-1/2 left-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
					onclick={prevSlide}
					disabled={currentSlide === 0}>
					<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7" />
					</svg>
				</button>

				<button
					class="absolute top-1/2 right-4 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-colors hover:bg-gray-50"
					onclick={nextSlide}
					disabled={currentSlide === slides.length - 1}>
					<svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			<!-- Dots Indicator -->
			<div class="mt-8 text-center">
				<p class="mb-4 text-lg font-semibold text-gray-700">
					총 {slides.length}개 컷 (좌우로 스와이핑)
				</p>
				<div class="flex justify-center space-x-2">
					{#each slides as _, index}
						<button
							class="h-3 w-3 rounded-full transition-colors {currentSlide === index
								? 'bg-pink-500'
								: 'bg-gray-300'}"
							onclick={() => goToSlide(index)}
							aria-label="슬라이드 {index + 1}로 이동">
						</button>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- Recommended Destinations Section -->
	<section class="border-b bg-white px-4 py-12">
		<div class="mx-auto max-w-6xl">
			<div class="mb-8 text-center">
				<h2 class="mb-4 text-3xl font-bold text-gray-900">Match Trip 서비스 지역</h2>
				<p class="text-lg text-gray-600">전 세계 인기 여행지에서 현지 전문가와 함께하세요</p>
			</div>

			<!-- Destinations Grid - 4x2 Gallery -->
			<div class="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
				<!-- Paris Card -->
				<div
					class="group relative overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105">
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-pink-200 to-purple-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🗼</div>
							<p class="text-sm text-gray-600">(사진)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">파리</h3>
						<p class="text-gray-200">(사진)</p>
					</div>
				</div>

				<!-- Prague Card -->
				<div
					class="group relative overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105">
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-blue-200 to-indigo-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🏰</div>
							<p class="text-sm text-gray-600">(사진)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">프라하</h3>
						<p class="text-gray-200">(사진)</p>
					</div>
				</div>

				<!-- Berlin Card -->
				<div
					class="group relative overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105">
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-green-200 to-teal-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🏛️</div>
							<p class="text-sm text-gray-600">(사진)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">베를린</h3>
						<p class="text-gray-200">(사진)</p>
					</div>
				</div>

				<!-- Frankfurt Card -->
				<div
					class="group relative overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105">
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-orange-200 to-red-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🏙️</div>
							<p class="text-sm text-gray-600">(사진)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">프랑크푸르트</h3>
						<p class="text-gray-200">(사진)</p>
					</div>
				</div>

				<!-- Rome Card -->
				<div
					class="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105"
					onclick={openComingSoonModal}>
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-red-200 to-orange-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🏛️</div>
							<p class="text-sm text-gray-600">(오픈 예정)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">로마</h3>
						<p class="text-gray-200">(오픈 예정)</p>
					</div>
				</div>

				<!-- Florence Card -->
				<div
					class="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105"
					onclick={openComingSoonModal}>
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-purple-200 to-pink-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🎨</div>
							<p class="text-sm text-gray-600">(오픈 예정)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">피렌체</h3>
						<p class="text-gray-200">(오픈 예정)</p>
					</div>
				</div>

				<!-- Madrid Card -->
				<div
					class="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105"
					onclick={openComingSoonModal}>
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-yellow-200 to-orange-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🏰</div>
							<p class="text-sm text-gray-600">(오픈 예정)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">마드리드</h3>
						<p class="text-gray-200">(오픈 예정)</p>
					</div>
				</div>

				<!-- Barcelona Card -->
				<div
					class="group relative cursor-pointer overflow-hidden rounded-xl bg-gray-100 shadow-lg transition-transform hover:scale-105"
					onclick={openComingSoonModal}>
					<div
						class="flex aspect-square items-center justify-center bg-gradient-to-br from-blue-200 to-teal-300">
						<div class="text-center">
							<div class="mb-2 text-6xl">🏖️</div>
							<p class="text-sm text-gray-600">(오픈 예정)</p>
						</div>
					</div>
					<div
						class="bg-opacity-20 group-hover:bg-opacity-30 absolute inset-0 bg-black transition-all">
					</div>
					<div
						class="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black to-transparent p-6">
						<h3 class="text-2xl font-bold text-white">바르셀로나</h3>
						<p class="text-gray-200">(오픈 예정)</p>
					</div>
				</div>
			</div>

			<!-- Service Areas Arrow -->
			<div class="mt-8 flex justify-end">
				<div class="flex items-center text-gray-600">
					<span class="mr-2 text-lg font-medium">서비스 지역</span>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3" />
					</svg>
				</div>
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
				<div class="mb-4 text-4xl">🚀</div>
				<h3 class="mb-2 text-xl font-bold text-gray-900">해당 서비스 지역은</h3>
				<h3 class="mb-4 text-xl font-bold text-gray-900">곧 오픈 예정입니다.</h3>
				<p class="mb-6 text-gray-600">
					더 많은 여행지에서 현지 전문가와 함께할 수 있도록 준비 중입니다.
				</p>
				<button
					class="rounded-lg bg-pink-500 px-6 py-2 text-white transition-colors hover:bg-pink-600"
					onclick={closeComingSoonModal}>
					확인
				</button>
			</div>
		</div>
	</div>
{/if}

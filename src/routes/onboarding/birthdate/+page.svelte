<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let selectedYear = $state(1990);
	let selectedMonth = $state(1);
	let selectedDay = $state(1);
	let isLoading = $state(false);
	let error = $state('');

	// Visual selection states (what appears centered)
	let visualYear = $state(1990);
	let visualMonth = $state(1);
	let visualDay = $state(1);

	// Track which items are in the selection area
	let inSelectionYear = $state<number | null>(null);
	let inSelectionMonth = $state<number | null>(null);
	let inSelectionDay = $state<number | null>(null);

	// Prevent recursive scroll updates
	let isSnapping = false;

	// Get current date for validation
	const currentYear = new Date().getFullYear();
	const minYear = currentYear - 100;
	const maxYear = currentYear - 14; // Must be at least 14 years old

	// Generate arrays for picker
	const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
	const months = Array.from({ length: 12 }, (_, i) => i + 1);

	const days = $derived(() => {
		const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
		return Array.from({ length: daysInMonth }, (_, i) => i + 1);
	});

	// Format display date
	const displayDate = $derived(() => {
		const year = selectedYear;
		const month = String(selectedMonth).padStart(2, '0');
		const day = String(selectedDay).padStart(2, '0');
		return `${year}년 ${month}월 ${day}일`;
	});

	// Pre-fill with existing birthdate if available
	$effect(() => {
		if ($page.data.user?.birthDate) {
			const date = new Date($page.data.user.birthDate);
			selectedYear = date.getFullYear();
			selectedMonth = date.getMonth() + 1;
			selectedDay = date.getDate();
			visualYear = selectedYear;
			visualMonth = selectedMonth;
			visualDay = selectedDay;
		}
	});

	// Scroll to selected values on mount
	$effect(() => {
		// Small delay to ensure DOM is ready
		setTimeout(() => {
			visualYear = selectedYear;
			visualMonth = selectedMonth;
			visualDay = selectedDay;
			inSelectionYear = selectedYear;
			inSelectionMonth = selectedMonth;
			inSelectionDay = selectedDay;
			scrollToSelected();

			// Update initial styles
			setTimeout(() => {
				const yearPicker = document.getElementById('year-picker');
				const monthPicker = document.getElementById('month-picker');
				const dayPicker = document.getElementById('day-picker');

				if (yearPicker) updateItemStyles(yearPicker, 'year');
				if (monthPicker) updateItemStyles(monthPicker, 'month');
				if (dayPicker) updateItemStyles(dayPicker, 'day');
			}, 200);
		}, 100);
	});

	function scrollToSelected() {
		const itemHeight = 40;
		const padding = 96;

		// Scroll year picker
		const yearPicker = document.getElementById('year-picker');
		const yearIndex = years.indexOf(selectedYear);
		if (yearPicker && yearIndex !== -1) {
			const centerPosition = yearPicker.clientHeight / 2;
			yearPicker.scrollTop = yearIndex * itemHeight - centerPosition + padding + itemHeight / 2;
		}

		// Scroll month picker
		const monthPicker = document.getElementById('month-picker');
		if (monthPicker) {
			const centerPosition = monthPicker.clientHeight / 2;
			monthPicker.scrollTop =
				(selectedMonth - 1) * itemHeight - centerPosition + padding + itemHeight / 2;
		}

		// Scroll day picker
		const dayPicker = document.getElementById('day-picker');
		if (dayPicker) {
			const centerPosition = dayPicker.clientHeight / 2;
			dayPicker.scrollTop =
				(selectedDay - 1) * itemHeight - centerPosition + padding + itemHeight / 2;
		}
	}

	// Update item styles based on what's in selection
	function updateItemStyles(container: HTMLElement, type: 'year' | 'month' | 'day') {
		const items = container.querySelectorAll('.picker-item');
		items.forEach((item) => {
			const element = item as HTMLElement;
			let value: number | null = null;

			if (type === 'year') {
				value = parseInt(element.dataset.year || '0');
				if (value === inSelectionYear) {
					element.className =
						'picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer text-black font-bold text-lg';
				} else {
					element.className =
						'picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer text-gray-400 text-base';
				}
			} else if (type === 'month') {
				value = parseInt(element.dataset.month || '0');
				if (value === inSelectionMonth) {
					element.className =
						'picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer text-black font-bold text-lg';
				} else {
					element.className =
						'picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer text-gray-400 text-base';
				}
			} else if (type === 'day') {
				value = parseInt(element.dataset.day || '0');
				if (value === inSelectionDay) {
					element.className =
						'picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer text-black font-bold text-lg';
				} else {
					element.className =
						'picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer text-gray-400 text-base';
				}
			}
		});
	}

	// Handle scroll snap
	function handlePickerScroll(e: Event, type: 'year' | 'month' | 'day') {
		if (isSnapping) return; // Prevent handling scroll during snap

		const target = e.target as HTMLElement;
		const itemHeight = 40;
		const padding = 96; // py-24 = 96px
		const containerHeight = target.clientHeight;
		const centerPosition = containerHeight / 2;
		const scrollTop = target.scrollTop;

		// Calculate which item is at the center, accounting for padding
		const adjustedScrollTop = scrollTop + centerPosition - padding;
		const index = Math.round(adjustedScrollTop / itemHeight);

		// Update which item is in the selection area
		if (type === 'year' && years[index]) {
			inSelectionYear = years[index];
			visualYear = years[index];
		} else if (type === 'month' && index >= 0 && index < 12) {
			inSelectionMonth = index + 1;
			visualMonth = index + 1;
		} else if (type === 'day') {
			const maxDay = days().length;
			const dayIndex = Math.min(Math.max(0, index), maxDay - 1);
			inSelectionDay = dayIndex + 1;
			visualDay = dayIndex + 1;
		}

		// Update all items' styles
		updateItemStyles(target, type);

		// Clear any existing timeout
		if (target.dataset.scrollTimeout) {
			clearTimeout(parseInt(target.dataset.scrollTimeout));
		}

		// Set a new timeout for snap and final selection
		const timeoutId = setTimeout(() => {
			isSnapping = true;

			// Calculate the exact position to center the item in selection area
			const targetScrollTop = index * itemHeight - centerPosition + padding + itemHeight / 2;

			// Update the actual selected values based on what's centered
			if (type === 'year' && years[index]) {
				selectedYear = years[index];
				target.scrollTop = targetScrollTop;
			} else if (type === 'month' && index >= 0 && index < 12) {
				selectedMonth = index + 1;
				target.scrollTop = targetScrollTop;
			} else if (type === 'day') {
				const maxDay = days().length;
				const dayIndex = Math.min(Math.max(0, index), maxDay - 1);
				selectedDay = dayIndex + 1;
				target.scrollTop = dayIndex * itemHeight - centerPosition + padding + itemHeight / 2;
			}

			// Reset the flag after animation
			setTimeout(() => {
				isSnapping = false;
			}, 300);
		}, 100);

		target.dataset.scrollTimeout = timeoutId.toString();
	}

	// Adjust day if it exceeds days in selected month
	$effect(() => {
		const maxDay = new Date(selectedYear, selectedMonth, 0).getDate();
		if (selectedDay > maxDay) {
			selectedDay = maxDay;
		}
	});

	async function handleSubmit() {
		isLoading = true;
		error = '';

		try {
			// Create ISO date string
			const birthDate = new Date(selectedYear, selectedMonth - 1, selectedDay)
				.toISOString()
				.split('T')[0];

			const response = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ birthDate })
			});

			if (!response.ok) {
				throw new Error('Failed to update birth date');
			}

			// Continue to signup complete page
			await goto('/onboarding/complete');
		} catch (err) {
			error = err instanceof Error ? err.message : '생년월일 저장에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	function formatMonth(month: number): string {
		return `${month}월`;
	}

	function formatDay(day: number): string {
		return `${day}일`;
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-white px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Progress indicator -->
		<div class="mb-8">
			<div class="mb-2 flex items-center justify-between">
				<span class="text-sm text-gray-600">3/4</span>
			</div>
			<div class="h-2 overflow-hidden rounded-full bg-gray-200">
				<div
					class="h-full rounded-full bg-blue-600 transition-all duration-300"
					style="width: 75%"
				></div>
			</div>
		</div>

		<div class="space-y-8">
			<div>
				<h1 class="mb-2 text-2xl font-bold text-gray-900">생년월일을 알려주세요</h1>
				<p class="text-gray-600">서비스 이용을 위해 필요한 정보입니다</p>
			</div>

			<!-- iOS Style Date Picker Always Visible -->
			<div class="rounded-2xl bg-gray-50 p-4">
				<div class="flex h-52 gap-1 overflow-hidden">
					<!-- Year Picker -->
					<div class="relative flex-1">
						<div
							class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-lg border-2 border-blue-400 bg-transparent"
						></div>
						<div
							class="picker-scroll h-full overflow-y-auto"
							id="year-picker"
							onscroll={(e) => handlePickerScroll(e, 'year')}
						>
							<div class="py-24" style="padding-top: 96px; padding-bottom: 96px;">
								{#each years as year}
									<div
										class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base text-gray-400 transition-all"
										data-year={year}
										onclick={() => {
											selectedYear = year;
											visualYear = year;
											inSelectionYear = year;
											scrollToSelected();
											setTimeout(() => {
												const yearPicker = document.getElementById('year-picker');
												if (yearPicker) updateItemStyles(yearPicker, 'year');
											}, 150);
										}}
									>
										{year}년
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Month Picker -->
					<div class="relative flex-1">
						<div
							class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-lg border-2 border-blue-400 bg-transparent"
						></div>
						<div
							class="picker-scroll h-full overflow-y-auto"
							id="month-picker"
							onscroll={(e) => handlePickerScroll(e, 'month')}
						>
							<div class="py-24" style="padding-top: 96px; padding-bottom: 96px;">
								{#each months as month}
									<div
										class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base text-gray-400 transition-all"
										data-month={month}
										onclick={() => {
											selectedMonth = month;
											visualMonth = month;
											inSelectionMonth = month;
											scrollToSelected();
											setTimeout(() => {
												const monthPicker = document.getElementById('month-picker');
												if (monthPicker) updateItemStyles(monthPicker, 'month');
											}, 150);
										}}
									>
										{formatMonth(month)}
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Day Picker -->
					<div class="relative flex-1">
						<div
							class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 rounded-lg border-2 border-blue-400 bg-transparent"
						></div>
						<div
							class="picker-scroll h-full overflow-y-auto"
							id="day-picker"
							onscroll={(e) => handlePickerScroll(e, 'day')}
						>
							<div class="py-24" style="padding-top: 96px; padding-bottom: 96px;">
								{#each days() as day}
									<div
										class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base text-gray-400 transition-all"
										data-day={day}
										onclick={() => {
											selectedDay = day;
											visualDay = day;
											inSelectionDay = day;
											scrollToSelected();
											setTimeout(() => {
												const dayPicker = document.getElementById('day-picker');
												if (dayPicker) updateItemStyles(dayPicker, 'day');
											}, 150);
										}}
									>
										{formatDay(day)}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<button
				onclick={handleSubmit}
				disabled={isLoading}
				class="w-full rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
			>
				{#if isLoading}
					저장 중...
				{:else}
					계속하기
				{/if}
			</button>

			<p class="mt-4 text-center text-sm text-gray-500">만 14세 이상만 가입할 수 있습니다</p>
		</div>
	</div>
</div>

<style>
	/* Hide scrollbar but keep functionality */
	.picker-scroll {
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
		scroll-snap-type: y mandatory;
		scroll-behavior: smooth;
	}

	.picker-scroll::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	.picker-item {
		scroll-snap-align: center;
		height: 40px;
	}
</style>

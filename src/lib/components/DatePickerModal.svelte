<script lang="ts">
	interface Props {
		showModal: boolean;
		selectedYear: number;
		selectedMonth: number;
		selectedDay: number;
		onConfirm: (year: number, month: number, day: number) => void;
		onCancel: () => void;
	}

	let { showModal, selectedYear, selectedMonth, selectedDay, onConfirm, onCancel }: Props =
		$props();

	// Temporary values for modal
	let tempYear = $state(selectedYear);
	let tempMonth = $state(selectedMonth);
	let tempDay = $state(selectedDay);

	// Update temp values when props change
	$effect(() => {
		if (showModal) {
			tempYear = selectedYear;
			tempMonth = selectedMonth;
			tempDay = selectedDay;
			// Scroll to selected values after modal opens
			setTimeout(() => {
				scrollToDate();
			}, 50);
		}
	});

	// Get current date for validation
	const currentYear = new Date().getFullYear();
	const minYear = currentYear - 100;
	const maxYear = currentYear - 14; // Must be at least 14 years old

	// Generate arrays for picker
	const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
	const months = Array.from({ length: 12 }, (_, i) => i + 1);

	const days = $derived(() => {
		const daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
		return Array.from({ length: daysInMonth }, (_, i) => i + 1);
	});

	// Scroll to selected date values
	function scrollToDate() {
		const yearPicker = document.getElementById('year-picker');
		const monthPicker = document.getElementById('month-picker');
		const dayPicker = document.getElementById('day-picker');

		if (yearPicker) {
			const yearIndex = years.indexOf(tempYear);
			if (yearIndex !== -1) {
				yearPicker.scrollTop = yearIndex * 40 - yearPicker.clientHeight / 2 + 20;
			}
		}

		if (monthPicker) {
			monthPicker.scrollTop = (tempMonth - 1) * 40 - monthPicker.clientHeight / 2 + 20;
		}

		if (dayPicker) {
			dayPicker.scrollTop = (tempDay - 1) * 40 - dayPicker.clientHeight / 2 + 20;
		}
	}

	// Track if we're currently snapping
	let isSnapping = false;

	// Handle scroll events
	function handleScroll(event: Event, type: 'year' | 'month' | 'day') {
		if (isSnapping) return;

		const target = event.target as HTMLElement;
		const scrollTop = target.scrollTop;
		const itemHeight = 40;
		const offset = target.clientHeight / 2 - 20;

		const index = Math.round((scrollTop + offset) / itemHeight);

		// Update temp values immediately for visual feedback
		if (type === 'year') {
			const year = years[Math.max(0, Math.min(index, years.length - 1))];
			if (year !== tempYear) {
				tempYear = year;
			}
		} else if (type === 'month') {
			const month = Math.max(1, Math.min(index + 1, 12));
			if (month !== tempMonth) {
				tempMonth = month;
			}
		} else if (type === 'day') {
			const maxDays = days().length;
			const day = Math.max(1, Math.min(index + 1, maxDays));
			if (day !== tempDay) {
				tempDay = day;
			}
		}

		// Clear any existing timeout
		clearTimeout((target as any).scrollTimeout);

		// Set new timeout for snapping
		(target as any).scrollTimeout = setTimeout(() => {
			snapToNearest(target, type);
		}, 150);
	}

	// Snap to nearest item
	function snapToNearest(container: HTMLElement, type: 'year' | 'month' | 'day') {
		isSnapping = true;
		const itemHeight = 40;
		const offset = container.clientHeight / 2 - 20;

		let targetIndex: number;

		if (type === 'year') {
			targetIndex = years.indexOf(tempYear);
		} else if (type === 'month') {
			targetIndex = tempMonth - 1;
		} else {
			targetIndex = tempDay - 1;
		}

		const targetScrollTop = targetIndex * itemHeight - offset;

		container.scrollTo({
			top: targetScrollTop,
			behavior: 'smooth'
		});

		// Reset snapping flag after animation
		setTimeout(() => {
			isSnapping = false;
		}, 300);
	}

	// Confirm date selection
	function confirmDate() {
		onConfirm(tempYear, tempMonth, tempDay);
	}

	// Format helpers
	function formatMonth(month: number): string {
		return `${month}월`;
	}

	function formatDay(day: number): string {
		return `${day}일`;
	}
</script>

{#if showModal}
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<!-- Backdrop -->
		<div class="absolute inset-0 bg-black/50" onclick={onCancel}></div>

		<!-- Modal Content -->
		<div class="animate-slide-up relative w-full max-w-md rounded-t-2xl bg-white p-4">
			<!-- Modal Header -->
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-gray-900">생년월일 선택</h3>
				<button onclick={onCancel} class="text-gray-400 hover:text-gray-600">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- iOS-style date picker -->
			<div class="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
				<!-- Selection highlight area -->
				<div
					class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 border-y-2 border-blue-400 bg-blue-50/30"
				></div>

				<div class="flex h-60">
					<!-- Year picker -->
					<div class="flex-1 overflow-hidden">
						<div
							id="year-picker"
							class="scrollbar-hide h-full overflow-y-auto px-4"
							onscroll={(e) => handleScroll(e, 'year')}
						>
							<div class="h-24"></div>
							{#each years as year}
								<div
									class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base transition-all {tempYear ===
									year
										? 'text-xl font-medium text-gray-900'
										: 'text-gray-400'}"
									onclick={() => {
										tempYear = year;
										const picker = document.getElementById('year-picker');
										if (picker) {
											const index = years.indexOf(year);
											picker.scrollTop = index * 40 - picker.clientHeight / 2 + 20;
										}
									}}
								>
									{year}년
								</div>
							{/each}
							<div class="h-24"></div>
						</div>
					</div>

					<!-- Month picker -->
					<div class="flex-1 overflow-hidden border-x border-gray-200">
						<div
							id="month-picker"
							class="scrollbar-hide h-full overflow-y-auto px-4"
							onscroll={(e) => handleScroll(e, 'month')}
						>
							<div class="h-24"></div>
							{#each months as month}
								<div
									class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base transition-all {tempMonth ===
									month
										? 'text-xl font-medium text-gray-900'
										: 'text-gray-400'}"
									onclick={() => {
										tempMonth = month;
										const picker = document.getElementById('month-picker');
										if (picker) {
											picker.scrollTop = (month - 1) * 40 - picker.clientHeight / 2 + 20;
										}
									}}
								>
									{formatMonth(month)}
								</div>
							{/each}
							<div class="h-24"></div>
						</div>
					</div>

					<!-- Day picker -->
					<div class="flex-1 overflow-hidden">
						<div
							id="day-picker"
							class="scrollbar-hide h-full overflow-y-auto px-4"
							onscroll={(e) => handleScroll(e, 'day')}
						>
							<div class="h-24"></div>
							{#each days() as day}
								<div
									class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base transition-all {tempDay ===
									day
										? 'text-xl font-medium text-gray-900'
										: 'text-gray-400'}"
									onclick={() => {
										tempDay = day;
										const picker = document.getElementById('day-picker');
										if (picker) {
											picker.scrollTop = (day - 1) * 40 - picker.clientHeight / 2 + 20;
										}
									}}
								>
									{formatDay(day)}
								</div>
							{/each}
							<div class="h-24"></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Modal Footer -->
			<div class="mt-4 flex gap-2">
				<button
					onclick={onCancel}
					class="flex-1 rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 hover:bg-gray-50"
				>
					취소
				</button>
				<button
					onclick={confirmDate}
					class="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700"
				>
					확인
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
		scroll-snap-type: y mandatory;
		scroll-behavior: smooth;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	.picker-item {
		height: 40px;
		scroll-snap-align: center;
		scroll-snap-stop: always;
	}

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

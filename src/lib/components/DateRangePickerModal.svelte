<script lang="ts">
	import { DateRangePicker } from 'bits-ui';
	import { CalendarDate } from '@internationalized/date';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';

	interface Props {
		open: boolean;
		value: { start?: CalendarDate; end?: CalendarDate };
		onClose: () => void;
		onApply: (dates: { start?: CalendarDate; end?: CalendarDate }) => void;
		title?: string;
	}

	let { open, value = $bindable(), onClose, onApply, title = '여행 일정' }: Props = $props();

	// Internal state for the date picker
	let internalValue = $state<{ start?: CalendarDate; end?: CalendarDate }>({});

	// Set default dates when opening
	$effect(() => {
		if (open) {
			if (value.start && value.end) {
				// Use existing values
				internalValue = { ...value };
			} else {
				// Set default dates (today to tomorrow)
				const today = new Date();
				const tomorrow = new Date(today);
				tomorrow.setDate(tomorrow.getDate() + 1);

				internalValue = {
					start: new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate()),
					end: new CalendarDate(tomorrow.getFullYear(), tomorrow.getMonth() + 1, tomorrow.getDate())
				};
			}
		}
	});

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

	function handleApply() {
		value = { ...internalValue };
		onApply(internalValue);
		onClose();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-end justify-center">
		<!-- Backdrop -->
		<button class="absolute inset-0 bg-black/60" onclick={onClose} aria-label="Close modal"
		></button>

		<!-- Modal Content -->
		<div class="animate-slide-up relative w-full max-w-lg rounded-t-[40px] bg-white shadow-xl">
			<div class="px-6 pt-6 pb-8">
				<!-- Calendar -->
				<DateRangePicker.Root
					bind:value={internalValue}
					weekdayFormat="short"
					fixedWeeks={true}
					numberOfMonths={1}
					locale="ko"
					class="w-full"
				>
					<DateRangePicker.Calendar class="w-full rounded-xl border border-gray-200 bg-white p-4">
						{#snippet children({ months, weekdays })}
							<DateRangePicker.Header class="mb-4 flex items-center justify-between">
								<DateRangePicker.PrevButton
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
								>
									<CaretLeft class="h-5 w-5" />
								</DateRangePicker.PrevButton>

								<DateRangePicker.Heading class="text-lg font-semibold" />

								<DateRangePicker.NextButton
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200"
								>
									<CaretRight class="h-5 w-5" />
								</DateRangePicker.NextButton>
							</DateRangePicker.Header>

							{#each months as month}
								<DateRangePicker.Grid class="w-full">
									<DateRangePicker.GridHead>
										<DateRangePicker.GridRow class="mb-2 grid grid-cols-7">
											{#each weekdays as day}
												<DateRangePicker.HeadCell
													class="text-center text-xs font-medium text-gray-500"
												>
													{day.slice(0, 1)}
												</DateRangePicker.HeadCell>
											{/each}
										</DateRangePicker.GridRow>
									</DateRangePicker.GridHead>

									<DateRangePicker.GridBody>
										{#each month.weeks as weekDates}
											<DateRangePicker.GridRow class="grid grid-cols-7">
												{#each weekDates as date}
													<DateRangePicker.Cell {date} month={month.value} class="relative p-0">
														<DateRangePicker.Day
															class="relative flex h-10 w-full items-center justify-center text-sm font-medium
															transition-all
															hover:bg-gray-100
															data-disabled:text-gray-300 data-disabled:hover:bg-transparent
															data-outside-month:text-gray-300
															data-selection-end:rounded-r-xl data-selection-end:bg-blue-500
															data-selection-end:text-white data-selection-middle:bg-blue-100
															data-selection-middle:text-gray-900 data-selection-start:rounded-l-xl data-selection-start:bg-blue-500
															data-selection-start:text-white data-today:font-semibold data-today:text-blue-600
															data-unavailable:text-gray-300 data-unavailable:hover:bg-transparent
															data-[selection-end]:z-10 data-[selection-start]:z-10"
														>
															{date.day}
														</DateRangePicker.Day>
													</DateRangePicker.Cell>
												{/each}
											</DateRangePicker.GridRow>
										{/each}
									</DateRangePicker.GridBody>
								</DateRangePicker.Grid>
							{/each}
						{/snippet}
					</DateRangePicker.Calendar>
				</DateRangePicker.Root>

				<div class="mt-8">
					<button
						onclick={handleApply}
						class="w-full rounded-xl bg-blue-500 py-4 text-center font-medium text-white hover:bg-blue-600"
					>
						{#if internalValue.start && internalValue.end}
							{(() => {
								const start = new Date(
									internalValue.start.year,
									internalValue.start.month - 1,
									internalValue.start.day
								);
								const end = new Date(
									internalValue.end.year,
									internalValue.end.month - 1,
									internalValue.end.day
								);
								const formatDate = (date: Date) => {
									const year = String(date.getFullYear()).slice(2);
									const month = date.getMonth() + 1;
									const day = date.getDate();
									return `${year}년 ${month}월 ${day}일`;
								};
								return `${formatDate(start)} ~ ${formatDate(end)}`;
							})()}
						{:else}
							날짜 선택
						{/if}
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

<style>
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

	/* Custom date range picker styles */
	:global([data-selected]:not([data-selection-start]):not([data-selection-end])) {
		background-color: rgb(219 234 254) !important; /* blue-100 */
		color: rgb(30 41 59) !important; /* text color */
		border-radius: 0 !important;
	}

	:global([data-selection-start]) {
		border-top-right-radius: 0 !important;
		border-bottom-right-radius: 0 !important;
	}

	:global([data-selection-end]) {
		border-top-left-radius: 0 !important;
		border-bottom-left-radius: 0 !important;
	}

	/* For single day selection */
	:global([data-selection-start][data-selection-end]) {
		border-radius: 0.75rem !important;
	}
</style>

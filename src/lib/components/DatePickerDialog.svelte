<script lang="ts">
	import { DatePicker, Dialog } from 'bits-ui';
	import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	let {
		open = $bindable(false),
		value = $bindable<CalendarDate | undefined>(undefined),
		placeholder = $bindable<CalendarDate>(today(getLocalTimeZone())),
		yearRange = 100,
		onSelect = (_date: CalendarDate) => {}
	} = $props();

	// Temporary value for selection before confirmation
	let tempValue = $state<CalendarDate | undefined>(undefined);
	let tempPlaceholder = $state<CalendarDate>(placeholder);

	// Korean weekday names mapping
	const weekdayMap: Record<string, string> = {
		Su: '일',
		Mo: '월',
		Tu: '화',
		We: '수',
		Th: '목',
		Fr: '금',
		Sa: '토'
	};

	function getKoreanWeekday(weekday: string): string {
		return weekdayMap[weekday.slice(0, 2)] || weekday.slice(0, 2);
	}

	// When dialog opens, initialize temp values
	$effect(() => {
		if (open) {
			tempValue = value;
			if (value) {
				tempPlaceholder = new CalendarDate(value.year, value.month, value.day);
			} else {
				tempPlaceholder = placeholder;
			}
		}
	});

	// Handle confirm
	function handleConfirm() {
		if (tempValue) {
			value = tempValue;
			onSelect(tempValue);
		}
		open = false;
	}

	// Handle cancel
	function handleCancel() {
		open = false;
	}

	// Handle reset
	function handleReset() {
		tempValue = undefined;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/60" onclick={handleCancel} />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-[51] w-[calc(100vw-32px)] max-w-[540px] -translate-x-1/2 -translate-y-1/2"
		>
			<div
				class="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_25px_50px_rgba(0,0,0,0.25)]"
			>
				<!-- Main content area -->
				<div class="flex h-[440px]">
					<!-- Year selector (left side) -->
					<div
						class="flex w-[60px] flex-col border-r border-[rgba(0,62,129,0.08)] bg-[rgba(0,62,129,0.02)]"
					>
						<div
							class="text-primary border-b border-[rgba(0,62,129,0.08)] bg-white p-4 text-center text-[13px] font-semibold"
						>
							연도
						</div>
						<div class="scrollbar-hide flex-1 overflow-y-auto py-2">
							{#each Array.from({ length: yearRange }, (_, i) => {
								const currentYear = new Date().getFullYear();
								const maxValidYear = currentYear - 14;
								return maxValidYear - i;
							}).filter((year) => year <= new Date().getFullYear() - 14) as year}
								<button
									type="button"
									class="text-primary hover:text-color-primary w-full px-4 py-2.5 text-center text-sm font-normal transition-all duration-200 hover:bg-[rgba(16,149,244,0.08)] {tempPlaceholder.year ===
									year
										? 'bg-color-primary hover:bg-color-primary year-selected font-semibold text-white hover:text-white'
										: ''}"
									onclick={() => {
										tempPlaceholder = new CalendarDate(
											year,
											tempPlaceholder.month,
											tempPlaceholder.day
										);
									}}
								>
									{year}
								</button>
							{/each}
						</div>
					</div>

					<!-- Calendar (right side) -->
					<DatePicker.Root
						bind:value={tempValue}
						bind:placeholder={tempPlaceholder}
						weekdayFormat="short"
						fixedWeeks={true}
					>
						<DatePicker.Calendar class="flex-1 overflow-y-auto p-5 pr-4">
							{#snippet children({ months, weekdays })}
								<DatePicker.Header class="mb-4">
									<div class="flex items-center justify-between">
										<DatePicker.PrevButton
											class="text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:bg-[rgba(0,62,129,0.04)]"
										>
											<ChevronLeft class="h-5 w-5" />
										</DatePicker.PrevButton>
										<DatePicker.Heading class="text-primary text-[15px] font-semibold">
											{#snippet children({ headingValue })}
												{@const parts = headingValue.split(' ')}
												{@const monthNames = [
													'January',
													'February',
													'March',
													'April',
													'May',
													'June',
													'July',
													'August',
													'September',
													'October',
													'November',
													'December'
												]}
												{@const monthIndex = monthNames.indexOf(parts[0])}
												{@const year = parts[1]}
												{year}년 {monthIndex + 1}월
											{/snippet}
										</DatePicker.Heading>
										<DatePicker.NextButton
											class="text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:bg-[rgba(0,62,129,0.04)]"
										>
											<ChevronRight class="h-5 w-5" />
										</DatePicker.NextButton>
									</div>
								</DatePicker.Header>
								<div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
									{#each months as month (month.value)}
										<DatePicker.Grid class="w-full border-collapse select-none">
											<DatePicker.GridHead>
												<DatePicker.GridRow class="mb-1 flex w-full">
													{#each weekdays as day (day)}
														<DatePicker.HeadCell
															class="text-secondary flex w-9 items-center justify-center text-xs font-normal"
														>
															<div>{getKoreanWeekday(day)}</div>
														</DatePicker.HeadCell>
													{/each}
												</DatePicker.GridRow>
											</DatePicker.GridHead>
											<DatePicker.GridBody>
												{#each month.weeks as weekDates (weekDates)}
													<DatePicker.GridRow class="mb-1 flex w-full">
														{#each weekDates as date (date)}
															<DatePicker.Cell
																{date}
																month={month.value}
																class="relative h-9 w-9 p-0 text-center text-sm"
															>
																<DatePicker.Day
																	class="text-primary hover:border-color-primary data-[selected]:bg-color-primary data-[today]:border-color-primary relative inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent text-[13px] font-normal transition-all duration-200 hover:bg-[rgba(16,149,244,0.08)] data-[disabled]:cursor-not-allowed data-[disabled]:text-[#c8d2d8] data-[outside-month]:pointer-events-none data-[outside-month]:text-[#c8d2d8] data-[selected]:font-semibold data-[selected]:text-white data-[today]:font-medium"
																>
																	{date.day}
																</DatePicker.Day>
															</DatePicker.Cell>
														{/each}
													</DatePicker.GridRow>
												{/each}
											</DatePicker.GridBody>
										</DatePicker.Grid>
									{/each}
								</div>
							{/snippet}
						</DatePicker.Calendar>
					</DatePicker.Root>
				</div>

				<!-- Button controls at bottom -->
				<div class="flex items-center justify-between border-t border-gray-100 bg-gray-50 p-4">
					<button
						type="button"
						onclick={handleReset}
						class="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
					>
						초기화
					</button>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={handleCancel}
							class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
						>
							취소
						</button>
						<button
							type="button"
							onclick={handleConfirm}
							disabled={!tempValue}
							class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 {tempValue
								? 'bg-blue-500 hover:bg-blue-600'
								: 'bg-gray-300'}"
						>
							확인
						</button>
					</div>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* Scrollbar Hide Utility */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>

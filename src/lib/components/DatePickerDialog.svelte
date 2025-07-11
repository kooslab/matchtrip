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

	// Korean weekday names mapping
	const weekdayMap: Record<string, string> = {
		'Su': '일',
		'Mo': '월',
		'Tu': '화',
		'We': '수',
		'Th': '목',
		'Fr': '금',
		'Sa': '토'
	};

	function getKoreanWeekday(weekday: string): string {
		return weekdayMap[weekday.slice(0, 2)] || weekday.slice(0, 2);
	}

	// Auto-scroll to selected year when dialog opens
	$effect(() => {
		if (open) {
			setTimeout(() => {
				const selectedYearElement = document.querySelector('.year-selected');
				if (selectedYearElement) {
					selectedYearElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
				}
			}, 100);
		}
	});

	// Prevent context menu globally when dialog is open
	$effect(() => {
		if (open) {
			const handleContextMenu = (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation();
				return false;
			};
			
			document.addEventListener('contextmenu', handleContextMenu);
			
			return () => {
				document.removeEventListener('contextmenu', handleContextMenu);
			};
		}
	});

	// Track when value changes to handle selection
	let lastValueString = $state<string | undefined>(undefined);
	
	// Handle date selection - only when value actually changes
	$effect(() => {
		if (value && open) {
			const currentValueString = `${value.year}-${value.month}-${value.day}`;
			if (currentValueString !== lastValueString) {
				lastValueString = currentValueString;
				onSelect(value);
				open = false;
			}
		}
	});

</script>

<style>
	/* Scrollbar Hide Utility */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Fade In Animation */
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	/* Slide Up Animation */
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translate(-50%, -45%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}
</style>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay 
			class="fixed inset-0 bg-black/60 z-50" 
			style="animation: fadeIn 0.2s ease-out"
			onclick={() => open = false}
		/>
		<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[51] w-[calc(100vw-32px)] max-w-[540px] bg-transparent" style="animation: slideUp 0.3s ease-out">
			<div 
				class="flex bg-white rounded-2xl border border-gray-100 shadow-[0_25px_50px_rgba(0,0,0,0.25)] overflow-hidden h-[440px]" 
				oncontextmenu={(e) => {
					e.preventDefault();
					e.stopPropagation();
					return false;
				}}
				onmousedown={(e) => {
					if (e.button === 2) {
						e.preventDefault();
						e.stopPropagation();
						return false;
					}
				}}
				role="dialog" 
				tabindex="-1"
			>
				<!-- Year selector (left side) -->
				<div class="w-[80px] bg-[rgba(0,62,129,0.02)] border-r border-[rgba(0,62,129,0.08)] flex flex-col">
					<div class="p-4 text-[13px] font-semibold text-primary text-center border-b border-[rgba(0,62,129,0.08)] bg-white">연도</div>
					<div class="flex-1 overflow-y-auto py-2 scrollbar-hide">
						{#each Array.from({ length: yearRange }, (_, i) => {
							const currentYear = new Date().getFullYear();
							const maxValidYear = currentYear - 14; // Must be at least 14 years old
							return maxValidYear - i;
						}).filter(year => {
							// Double-check: only show years that would make user 14+ years old
							const currentYear = new Date().getFullYear();
							return year <= currentYear - 14;
						}) as year}
							<button
								type="button"
								class="w-full py-2.5 px-4 text-center text-sm font-normal text-primary bg-none border-none cursor-pointer transition-all duration-200 hover:bg-[rgba(16,149,244,0.08)] hover:text-color-primary {placeholder.year === year ? 'bg-color-primary text-white font-semibold hover:bg-color-primary hover:text-white year-selected' : ''}"
								onclick={() => {
									// Create new CalendarDate with selected year
									placeholder = new CalendarDate(year, placeholder.month, placeholder.day);
								}}
							>
								{year}
							</button>
						{/each}
					</div>
				</div>
				
				<!-- Calendar (right side) -->
				<DatePicker.Root bind:value bind:placeholder weekdayFormat="short" fixedWeeks={true}>
					<DatePicker.Calendar 
						class="flex-1 overflow-y-auto p-5 pr-4" 
						oncontextmenu={(e) => {
							e.preventDefault();
							e.stopPropagation();
							return false;
						}}
						onmousedown={(e) => {
							if (e.button === 2) {
								e.preventDefault();
								e.stopPropagation();
								return false;
							}
						}}
					>
						{#snippet children({ months, weekdays })}
							<DatePicker.Header class="mb-4">
								<div class="flex items-center justify-between">
									<DatePicker.PrevButton class="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer inline-flex items-center justify-center text-primary transition-all duration-200 hover:bg-[rgba(0,62,129,0.04)]">
										<ChevronLeft class="w-5 h-5" />
									</DatePicker.PrevButton>
									<DatePicker.Heading class="text-[15px] font-semibold text-primary">
										{#snippet children({ headingValue })}
											{@const parts = headingValue.split(' ')}
											{@const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']}
											{@const monthIndex = monthNames.indexOf(parts[0])}
											{@const year = parts[1]}
											{year}년 {monthIndex + 1}월
										{/snippet}
									</DatePicker.Heading>
									<DatePicker.NextButton class="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer inline-flex items-center justify-center text-primary transition-all duration-200 hover:bg-[rgba(0,62,129,0.04)]">
										<ChevronRight class="w-5 h-5" />
									</DatePicker.NextButton>
								</div>
							</DatePicker.Header>
							<div class="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
								{#each months as month (month.value)}
									<DatePicker.Grid class="w-full border-collapse select-none">
										<DatePicker.GridHead>
											<DatePicker.GridRow class="mb-1 flex w-full">
												{#each weekdays as day (day)}
													<DatePicker.HeadCell class="text-secondary font-normal w-9 text-xs flex items-center justify-center">
														<div>{getKoreanWeekday(day)}</div>
													</DatePicker.HeadCell>
												{/each}
											</DatePicker.GridRow>
										</DatePicker.GridHead>
										<DatePicker.GridBody>
											{#each month.weeks as weekDates (weekDates)}
												<DatePicker.GridRow class="flex w-full mb-1">
													{#each weekDates as date (date)}
														<DatePicker.Cell
															{date}
															month={month.value}
															class="relative w-9 h-9 p-0 text-center text-sm"
														>
															<DatePicker.Day class="w-9 h-9 rounded-lg inline-flex items-center justify-center relative border border-transparent bg-transparent text-primary text-[13px] font-normal cursor-pointer transition-all duration-200 hover:bg-[rgba(16,149,244,0.08)] hover:border-color-primary data-[disabled]:text-[#c8d2d8] data-[disabled]:cursor-not-allowed data-[outside-month]:text-[#c8d2d8] data-[outside-month]:pointer-events-none data-[selected]:bg-color-primary data-[selected]:text-white data-[selected]:font-semibold data-[today]:border-color-primary data-[today]:font-medium">
																<div class="bg-color-primary group-data-selected:bg-white group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"></div>
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
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
<script lang="ts">
	import { DateRangePicker } from 'bits-ui';
	import { CalendarDate } from '@internationalized/date';
	import CalendarBlank from 'phosphor-svelte/lib/CalendarBlank';
	import CaretLeft from 'phosphor-svelte/lib/CaretLeft';
	import CaretRight from 'phosphor-svelte/lib/CaretRight';
	
	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}
	
	let { formData, onUpdate }: Props = $props();
	
	// Initialize dates as CalendarDate objects for bits-ui
	let value = $state<{ start: CalendarDate | undefined; end: CalendarDate | undefined }>({
		start: undefined,
		end: undefined
	});
	
	// Initialize from formData
	$effect(() => {
		if (formData.startDate) {
			const date = typeof formData.startDate === 'string' 
				? new Date(formData.startDate) 
				: formData.startDate;
			if (date instanceof Date && !isNaN(date.getTime())) {
				value.start = new CalendarDate(
					date.getFullYear(),
					date.getMonth() + 1, // CalendarDate months are 1-indexed
					date.getDate()
				);
			}
		}
		if (formData.endDate) {
			const date = typeof formData.endDate === 'string' 
				? new Date(formData.endDate) 
				: formData.endDate;
			if (date instanceof Date && !isNaN(date.getTime())) {
				value.end = new CalendarDate(
					date.getFullYear(),
					date.getMonth() + 1, // CalendarDate months are 1-indexed
					date.getDate()
				);
			}
		}
	});
	
	// Update parent when dates change
	function handleDateChange(dates: any) {
		console.log('Date change event:', dates);
		value = dates;
		
		// Handle calendar date objects from bits-ui
		if (dates.start) {
			// Convert calendar date to JS Date
			const jsDate = new Date(dates.start.year, dates.start.month - 1, dates.start.day);
			// Store as ISO string to ensure proper serialization
			onUpdate('startDate', jsDate.toISOString());
		}
		if (dates.end) {
			// Convert calendar date to JS Date
			const jsDate = new Date(dates.end.year, dates.end.month - 1, dates.end.day);
			// Store as ISO string to ensure proper serialization
			onUpdate('endDate', jsDate.toISOString());
		}
	}
	
	// Validation
	export function validate() {
		if (!value.start || !value.end) {
			alert('여행 날짜를 모두 선택해주세요.');
			return false;
		}
		return true;
	}
	
	// Format date for display
	function formatDate(calendarDate: CalendarDate | undefined) {
		if (!calendarDate) return '';
		
		// Convert CalendarDate to JS Date for formatting
		const jsDate = new Date(
			calendarDate.year,
			calendarDate.month - 1, // JS Date months are 0-indexed
			calendarDate.day
		);
		
		return new Intl.DateTimeFormat('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		}).format(jsDate);
	}
</script>

<div class="bg-white">
	<div class="px-4 py-6">
		<h1 class="text-2xl font-bold text-gray-900">언제 떠나시나요?</h1>
		<p class="mt-2 text-gray-600">여행 날짜를 선택해주세요</p>
	</div>
	
	<!-- Date Range Display -->
	<div class="mx-4 mb-6 rounded-xl bg-gray-50 p-4">
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<p class="text-sm text-gray-600">출발일</p>
				<p class="mt-1 font-medium text-gray-900">
					{value.start ? formatDate(value.start) : '날짜 선택'}
				</p>
			</div>
			<div class="mx-4 text-gray-400">→</div>
			<div class="flex-1 text-right">
				<p class="text-sm text-gray-600">도착일</p>
				<p class="mt-1 font-medium text-gray-900">
					{value.end ? formatDate(value.end) : '날짜 선택'}
				</p>
			</div>
		</div>
	</div>
	
	<!-- Calendar -->
	<div class="px-4 pb-6">
		<DateRangePicker.Root
			bind:value={value}
			onValueChange={handleDateChange}
			weekdayFormat="short"
			fixedWeeks={true}
			numberOfMonths={1}
			locale="ko"
			class="w-full"
		>
			<!-- Calendar directly displayed -->
			<DateRangePicker.Calendar
				class="w-full rounded-xl border border-gray-200 bg-white p-4"
			>
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
										<DateRangePicker.HeadCell class="text-center text-xs font-medium text-gray-500">
											{day.slice(0, 1)}
										</DateRangePicker.HeadCell>
									{/each}
								</DateRangePicker.GridRow>
							</DateRangePicker.GridHead>
							
							<DateRangePicker.GridBody>
								{#each month.weeks as weekDates}
									<DateRangePicker.GridRow class="grid grid-cols-7">
										{#each weekDates as date, i}
											<DateRangePicker.Cell {date} month={month.value} class="relative">
												<DateRangePicker.Day
													class="relative flex h-10 w-full items-center justify-center text-sm font-medium transition-all
													rounded-none
													hover:bg-gray-100
													data-disabled:text-gray-300 data-disabled:hover:bg-transparent
													data-unavailable:text-gray-300 data-unavailable:hover:bg-transparent
													data-outside-month:text-gray-300
													data-today:font-semibold data-today:text-blue-600
													data-selected:bg-blue-500 data-selected:text-white data-selected:hover:bg-blue-600
													data-selection-start:bg-blue-500 data-selection-start:text-white data-selection-start:hover:bg-blue-600 data-selection-start:rounded-l-full
													data-selection-end:bg-blue-500 data-selection-end:text-white data-selection-end:hover:bg-blue-600 data-selection-end:rounded-r-full"
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
	</div>
</div>
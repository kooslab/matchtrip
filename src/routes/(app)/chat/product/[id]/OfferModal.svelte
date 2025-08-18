<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import DateRangePickerModal from '$lib/components/DateRangePickerModal.svelte';

	interface Props {
		onClose: () => void;
		onSubmit: (data: { price: number; duration: number; startDate: Date; endDate: Date }) => void;
		sending?: boolean;
	}

	const { onClose, onSubmit, sending = false }: Props = $props();

	let price = $state('');
	let showDatePicker = $state(false);
	let selectedDates = $state<{ start?: CalendarDate; end?: CalendarDate }>({});
	let startDate = $state<Date | null>(null);
	let endDate = $state<Date | null>(null);
	let duration = $state(0);

	// Format price input with commas
	function formatPriceInput(value: string) {
		// Remove non-numeric characters
		const numericValue = value.replace(/[^0-9]/g, '');
		// Add commas
		return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	}

	// Handle price input
	function handlePriceInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const formatted = formatPriceInput(input.value);
		price = formatted;
	}

	// Calculate duration from dates
	function calculateDuration(start: Date, end: Date): number {
		const diffTime = Math.abs(end.getTime() - start.getTime());
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays + 1; // Include both start and end dates
	}

	// Handle date selection
	function handleDateApply(dates: { start?: CalendarDate; end?: CalendarDate }) {
		if (dates.start && dates.end) {
			selectedDates = dates;
			startDate = new Date(dates.start.year, dates.start.month - 1, dates.start.day);
			endDate = new Date(dates.end.year, dates.end.month - 1, dates.end.day);
			duration = calculateDuration(startDate, endDate);
		}
		showDatePicker = false;
	}

	// Format date for display
	function formatDate(date: Date): string {
		return new Intl.DateTimeFormat('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).format(date);
	}

	// Handle form submission
	function handleSubmit() {
		const priceValue = parseInt(price.replace(/,/g, ''));

		if (!priceValue) {
			alert('가격을 입력해주세요.');
			return;
		}

		if (!startDate || !endDate) {
			alert('여행 날짜를 선택해주세요.');
			return;
		}

		onSubmit({
			price: priceValue,
			duration: duration,
			startDate: startDate,
			endDate: endDate
		});
	}
</script>

<!-- Backdrop -->
<div class="fixed inset-0 z-50 flex items-end bg-black/50" onclick={onClose}>
	<!-- Modal -->
	<div
		class="mx-auto w-full max-w-[430px] rounded-t-2xl bg-white p-4"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="mx-auto mb-4 h-1 w-12 rounded-full bg-gray-300"></div>

		<h2 class="mb-4 text-lg font-bold">제안하기</h2>

		<!-- Price Input -->
		<div class="mb-4">
			<label class="mb-2 block text-sm font-medium text-gray-700"> 총 금액 </label>
			<div class="relative">
				<input
					type="text"
					value={price}
					oninput={handlePriceInput}
					placeholder="여행 총 금액을 입력해 주세요"
					class="w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					disabled={sending}
				/>
				<span class="absolute top-1/2 right-4 -translate-y-1/2 text-gray-500"> 원 </span>
			</div>
		</div>

		<!-- Date Selection -->
		<div class="mb-4">
			<label class="mb-2 block text-sm font-medium text-gray-700"> 여행 날짜 </label>
			<button
				onclick={() => (showDatePicker = true)}
				class="w-full rounded-lg border px-4 py-3 text-left hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				disabled={sending}
			>
				{#if startDate && endDate}
					<span class="text-gray-900">
						{formatDate(startDate)} - {formatDate(endDate)} ({duration}일)
					</span>
				{:else}
					<span class="text-gray-400">날짜를 선택해주세요</span>
				{/if}
			</button>
		</div>

		<!-- Submit Button -->
		<button
			onclick={handleSubmit}
			disabled={!price || !startDate || !endDate || sending}
			class="w-full rounded-lg bg-blue-500 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
		>
			{sending ? '전송 중...' : '제안하기'}
		</button>
	</div>
</div>

<!-- Date Range Picker Modal -->
{#if showDatePicker}
	<DateRangePickerModal
		open={showDatePicker}
		value={selectedDates}
		onClose={() => (showDatePicker = false)}
		onApply={handleDateApply}
		title="여행 날짜 선택"
	/>
{/if}

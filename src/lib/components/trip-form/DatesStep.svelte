<script lang="ts">
	import CalendarIcon from '$lib/icons/icon-calendar-check-mono.svg';

	interface Props {
		formData: any;
		onUpdate: (field: string, value: any) => void;
	}

	let { formData, onUpdate }: Props = $props();

	// Local state for date inputs
	let startDate = $state('');
	let endDate = $state('');

	// Initialize dates
	$effect(() => {
		if (formData.startDate) {
			startDate =
				formData.startDate instanceof Date
					? formData.startDate.toISOString().split('T')[0]
					: new Date(formData.startDate).toISOString().split('T')[0];
		}
		if (formData.endDate) {
			endDate =
				formData.endDate instanceof Date
					? formData.endDate.toISOString().split('T')[0]
					: new Date(formData.endDate).toISOString().split('T')[0];
		}
	});

	// Update parent when dates change
	$effect(() => {
		if (startDate) {
			onUpdate('startDate', new Date(startDate));
		}
		if (endDate) {
			onUpdate('endDate', new Date(endDate));
		}
	});

	// Calculate trip duration
	let duration = $derived(
		startDate && endDate
			? Math.ceil(
					(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
				) + 1
			: 0
	);

	// Set min date to today
	const today = new Date().toISOString().split('T')[0];

	// Validation
	export function validate() {
		if (!startDate || !endDate) {
			alert('여행 날짜를 모두 선택해주세요.');
			return false;
		}

		if (new Date(endDate) < new Date(startDate)) {
			alert('종료일은 시작일 이후여야 합니다.');
			return false;
		}

		return true;
	}
</script>

<div class="rounded-lg bg-white p-4">
	<div class="mb-4 flex items-center gap-3">
		<img src={CalendarIcon} alt="" class="h-6 w-6 text-blue-500" />
		<h2 class="text-lg font-semibold text-gray-900">언제 여행하시나요?</h2>
	</div>

	<!-- Date inputs -->
	<div class="space-y-4">
		<div>
			<label for="start-date" class="mb-2 block text-sm font-medium text-gray-700"> 출발일 </label>
			<input
				id="start-date"
				type="date"
				bind:value={startDate}
				min={today}
				class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<div>
			<label for="end-date" class="mb-2 block text-sm font-medium text-gray-700"> 도착일 </label>
			<input
				id="end-date"
				type="date"
				bind:value={endDate}
				min={startDate || today}
				class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</div>
	</div>

	<!-- Duration display -->
	{#if duration > 0}
		<div class="mt-4 rounded-lg bg-blue-50 p-3">
			<p class="text-sm text-blue-600">여행 기간</p>
			<p class="font-medium text-blue-900">
				{duration - 1}박 {duration}일
			</p>
		</div>
	{/if}
</div>

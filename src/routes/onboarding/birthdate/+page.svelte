<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import DatePickerModal from '$lib/components/DatePickerModal.svelte';

	let selectedYear = $state(1990);
	let selectedMonth = $state(1);
	let selectedDay = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	let showDatePicker = $state(false);

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
		}
	});

	// Handle date picker confirm
	function handleDateConfirm(year: number, month: number, day: number) {
		selectedYear = year;
		selectedMonth = month;
		selectedDay = day;
		showDatePicker = false;
	}

	// Handle date picker cancel
	function handleDateCancel() {
		showDatePicker = false;
	}

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

			<!-- Date Display Button -->
			<button
				type="button"
				onclick={() => showDatePicker = true}
				class="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
			>
				<div class="text-center text-sm text-gray-600">{displayDate()}</div>
			</button>

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

<!-- Date Picker Modal -->
<DatePickerModal 
	showModal={showDatePicker}
	{selectedYear}
	{selectedMonth}
	{selectedDay}
	onConfirm={handleDateConfirm}
	onCancel={handleDateCancel}
/>
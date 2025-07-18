<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';
	import CalendarIcon from '$lib/icons/icon-calendar-check-mono.svg';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Form state
	let startDate = $state('');
	let endDate = $state('');

	// Initialize form on mount
	onMount(() => {
		const formData = tripEditForm.getData();
		if (formData.startDate) {
			startDate = formData.startDate.toISOString().split('T')[0];
		} else if (trip.startDate) {
			startDate = new Date(trip.startDate).toISOString().split('T')[0];
		}

		if (formData.endDate) {
			endDate = formData.endDate.toISOString().split('T')[0];
		} else if (trip.endDate) {
			endDate = new Date(trip.endDate).toISOString().split('T')[0];
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

	// Navigation
	function handleNext() {
		if (!startDate || !endDate) {
			alert('여행 날짜를 모두 선택해주세요.');
			return;
		}

		if (new Date(endDate) < new Date(startDate)) {
			alert('종료일은 시작일 이후여야 합니다.');
			return;
		}

		tripEditForm.updateStep('startDate', new Date(startDate));
		tripEditForm.updateStep('endDate', new Date(endDate));
		goto(`/my-trips/${trip.id}/edit/travelers`);
	}

	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/destination`);
	}

	// Set min date to today
	const today = new Date().toISOString().split('T')[0];
</script>

<div class="px-4 py-6">
	<div class="rounded-lg bg-white p-4">
		<div class="mb-4 flex items-center gap-3">
			<img src={CalendarIcon} alt="" class="h-6 w-6 text-blue-500" />
			<h2 class="text-lg font-semibold text-gray-900">언제 여행하시나요?</h2>
		</div>

		<!-- Date inputs -->
		<div class="space-y-4">
			<div>
				<label for="start-date" class="mb-2 block text-sm font-medium text-gray-700">
					출발일
				</label>
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

	<!-- Action buttons -->
	<div class="fixed right-0 bottom-0 left-0 flex gap-3 border-t border-gray-200 bg-white p-4 pb-24">
		<button
			onclick={handleBack}
			class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 hover:bg-gray-200"
		>
			이전
		</button>
		<button
			onclick={handleNext}
			class="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600"
		>
			다음
		</button>
	</div>
</div>

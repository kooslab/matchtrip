<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { offerFormStore } from '$lib/stores/offerForm';
	import { colors } from '$lib/constants/colors';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Format date for display
	function formatDate(date: string | Date) {
		const d = new Date(date);
		return d.toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		});
	}

	// Calculate trip duration
	function getTripDuration(start: string | Date, end: string | Date) {
		const startDate = new Date(start);
		const endDate = new Date(end);
		const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		const nights = days - 1;
		return `${nights}박 ${days}일`;
	}

	// Store trip ID when component mounts
	onMount(() => {
		const tripId = $page.url.searchParams.get('tripId');
		if (tripId) {
			offerFormStore.setTripId(tripId);
		}
	});

	function handleNext() {
		goto(`/offers/create/price?tripId=${trip.id}`);
	}

	// Format budget
	function formatBudget(amount: string | number, currency: string) {
		const num = typeof amount === 'string' ? parseInt(amount) : amount;
		return new Intl.NumberFormat('ko-KR').format(num) + ' ' + currency;
	}

	// Calculate total travelers
	const totalTravelers = $derived(
		(trip.adultsCount || 0) + (trip.childrenCount || 0) + (trip.infantsCount || 0)
	);
</script>

<div class="flex-1 px-4 py-6 pb-40">
	<!-- Traveler Info Card -->
	<div class="mb-6 rounded-xl bg-white p-4 shadow-sm">
		<div class="mb-4 flex items-center gap-3">
			{#if trip.travelerImage}
				<img
					src={trip.travelerImage}
					alt={trip.travelerName}
					class="h-12 w-12 rounded-full object-cover"
				/>
			{:else}
				<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
					<span class="text-lg font-medium text-gray-600">
						{trip.travelerName?.charAt(0) || '?'}
					</span>
				</div>
			{/if}
			<div>
				<h3 class="font-semibold text-gray-900">{trip.travelerName || '여행자'}</h3>
				<p class="text-sm text-gray-500">{trip.travelerEmail}</p>
			</div>
		</div>

		<!-- Trip Overview -->
		<div class="space-y-3 border-t border-gray-100 pt-4">
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">여행지</span>
				<span class="font-medium text-gray-900">{trip.destination}</span>
			</div>

			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">여행 기간</span>
				<div class="text-right">
					<p class="font-medium text-gray-900">
						{getTripDuration(trip.departureDate, trip.returnDate)}
					</p>
					<p class="text-xs text-gray-500">
						{formatDate(trip.departureDate)} - {formatDate(trip.returnDate)}
					</p>
				</div>
			</div>

			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-600">인원</span>
				<div class="text-right">
					<p class="font-medium text-gray-900">총 {totalTravelers}명</p>
					<p class="text-xs text-gray-500">
						{#if trip.adultsCount > 0}성인 {trip.adultsCount}명{/if}
						{#if trip.childrenCount > 0}, 어린이 {trip.childrenCount}명{/if}
						{#if trip.infantsCount > 0}, 유아 {trip.infantsCount}명{/if}
					</p>
				</div>
			</div>

			{#if trip.budget}
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-600">예산</span>
					<span class="font-medium text-gray-900">
						{formatBudget(trip.budget, trip.currency || 'KRW')}
					</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Additional Info -->
	{#if trip.customRequest}
		<div class="mb-6 rounded-xl bg-white p-4 shadow-sm">
			<div>
				<h4 class="mb-2 text-sm font-medium text-gray-700">특별 요청사항</h4>
				<p class="text-sm text-gray-600">{trip.customRequest}</p>
			</div>
		</div>
	{/if}

	<!-- Info Box -->
	<div class="rounded-lg bg-blue-50 p-4">
		<p class="text-sm text-blue-800">
			위 여행 정보를 확인하고, 여행자에게 최적의 제안을 준비해주세요.
		</p>
	</div>
</div>

<!-- Bottom Button -->
<div
	class="fixed right-0 bottom-20 left-0 bg-white px-4 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
>
	<button
		onclick={handleNext}
		class="w-full rounded-lg py-3.5 text-base font-semibold text-white transition-all hover:opacity-90"
		style="background-color: {colors.primary}"
	>
		다음
	</button>
</div>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';
	import UserIcon from '$lib/icons/icon-user-two-mono.svg';
	
	let { data } = $props();
	let trip = $derived(data.trip);
	
	// Form state
	let adultsCount = $state(1);
	let childrenCount = $state(0);
	
	// Initialize form on mount
	onMount(() => {
		const formData = tripEditForm.getData();
		adultsCount = formData.adultsCount || trip.adultsCount || 1;
		childrenCount = formData.childrenCount || trip.childrenCount || 0;
	});
	
	// Total travelers
	let totalTravelers = $derived(adultsCount + childrenCount);
	
	// Handle count changes
	function increaseAdults() {
		if (adultsCount < 20) adultsCount++;
	}
	
	function decreaseAdults() {
		if (adultsCount > 1) adultsCount--;
	}
	
	function increaseChildren() {
		if (childrenCount < 10) childrenCount++;
	}
	
	function decreaseChildren() {
		if (childrenCount > 0) childrenCount--;
	}
	
	// Navigation
	function handleNext() {
		tripEditForm.updateStep('adultsCount', adultsCount);
		tripEditForm.updateStep('childrenCount', childrenCount);
		goto(`/my-trips/${trip.id}/edit/travel-style`);
	}
	
	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/dates`);
	}
</script>

<div class="px-4 py-6">
	<div class="rounded-lg bg-white p-4">
		<div class="mb-4 flex items-center gap-3">
			<img src={UserIcon} alt="" class="h-6 w-6 text-blue-500" />
			<h2 class="text-lg font-semibold text-gray-900">몇 명이 여행하나요?</h2>
		</div>
		
		<!-- Traveler counts -->
		<div class="space-y-4">
			<!-- Adults -->
			<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
				<div>
					<p class="font-medium text-gray-900">성인</p>
					<p class="text-sm text-gray-500">만 13세 이상</p>
				</div>
				<div class="flex items-center gap-3">
					<button
						onclick={decreaseAdults}
						disabled={adultsCount <= 1}
						class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span class="text-xl leading-none">−</span>
					</button>
					<span class="w-8 text-center font-medium text-gray-900">{adultsCount}</span>
					<button
						onclick={increaseAdults}
						disabled={adultsCount >= 20}
						class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span class="text-xl leading-none">+</span>
					</button>
				</div>
			</div>
			
			<!-- Children -->
			<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
				<div>
					<p class="font-medium text-gray-900">아동</p>
					<p class="text-sm text-gray-500">만 2-12세</p>
				</div>
				<div class="flex items-center gap-3">
					<button
						onclick={decreaseChildren}
						disabled={childrenCount <= 0}
						class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span class="text-xl leading-none">−</span>
					</button>
					<span class="w-8 text-center font-medium text-gray-900">{childrenCount}</span>
					<button
						onclick={increaseChildren}
						disabled={childrenCount >= 10}
						class="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span class="text-xl leading-none">+</span>
					</button>
				</div>
			</div>
		</div>
		
		<!-- Total display -->
		<div class="mt-4 rounded-lg bg-blue-50 p-3">
			<p class="text-sm text-blue-600">총 여행자</p>
			<p class="font-medium text-blue-900">
				{totalTravelers}명
				{#if childrenCount > 0}
					(성인 {adultsCount}, 아동 {childrenCount})
				{/if}
			</p>
		</div>
	</div>
	
	<!-- Action buttons -->
	<div class="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-gray-200 bg-white p-4 pb-24">
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
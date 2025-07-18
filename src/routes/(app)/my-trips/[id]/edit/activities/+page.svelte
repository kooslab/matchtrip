<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { tripEditForm } from '$lib/stores/tripEditForm';
	import { onMount } from 'svelte';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Activity categories
	const activityCategories = [
		{ value: 'sightseeing', label: '관광 명소', icon: '📸' },
		{ value: 'museum', label: '박물관/미술관', icon: '🖼️' },
		{ value: 'outdoor', label: '야외 활동', icon: '🥾' },
		{ value: 'water_sports', label: '수상 스포츠', icon: '🏄' },
		{ value: 'wellness', label: '웰니스/스파', icon: '💆' },
		{ value: 'nightlife', label: '나이트라이프', icon: '🌃' },
		{ value: 'local_experience', label: '현지 체험', icon: '🎭' },
		{ value: 'cooking', label: '쿠킹 클래스', icon: '👨‍🍳' }
	];

	// Interest categories
	const interestCategories = [
		{ value: 'history', label: '역사', icon: '🏛️' },
		{ value: 'art', label: '예술', icon: '🎨' },
		{ value: 'nature', label: '자연', icon: '🌲' },
		{ value: 'food', label: '음식', icon: '🍜' },
		{ value: 'photography', label: '사진', icon: '📷' },
		{ value: 'sports', label: '스포츠', icon: '⚽' },
		{ value: 'music', label: '음악', icon: '🎵' },
		{ value: 'shopping', label: '쇼핑', icon: '🛒' }
	];

	// Form state
	let selectedActivities = $state<string[]>([]);
	let selectedInterests = $state<string[]>([]);

	// Initialize form on mount
	onMount(() => {
		const formData = tripEditForm.getData();
		selectedActivities = formData.activities || trip.activities || [];
		selectedInterests = formData.interests || trip.interests || [];
	});

	// Toggle selection
	function toggleActivity(value: string) {
		if (selectedActivities.includes(value)) {
			selectedActivities = selectedActivities.filter((a) => a !== value);
		} else {
			selectedActivities = [...selectedActivities, value];
		}
	}

	function toggleInterest(value: string) {
		if (selectedInterests.includes(value)) {
			selectedInterests = selectedInterests.filter((i) => i !== value);
		} else {
			selectedInterests = [...selectedInterests, value];
		}
	}

	// Navigation
	function handleNext() {
		if (selectedActivities.length === 0 && selectedInterests.length === 0) {
			alert('최소 하나 이상의 활동이나 관심사를 선택해주세요.');
			return;
		}

		tripEditForm.updateStep('activities', selectedActivities);
		tripEditForm.updateStep('interests', selectedInterests);
		goto(`/my-trips/${trip.id}/edit/review`);
	}

	function handleBack() {
		goto(`/my-trips/${trip.id}/edit/accommodation`);
	}
</script>

<div class="px-4 py-6 pb-24">
	<div class="space-y-4">
		<!-- Activities section -->
		<div class="rounded-lg bg-white p-4">
			<h3 class="mb-3 text-base font-semibold text-gray-900">하고 싶은 활동</h3>
			<div class="grid grid-cols-2 gap-2">
				{#each activityCategories as activity}
					<button
						onclick={() => toggleActivity(activity.value)}
						class="flex items-center gap-2 rounded-lg border p-3 text-sm transition-all {selectedActivities.includes(
							activity.value
						)
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<span>{activity.icon}</span>
						<span
							class={selectedActivities.includes(activity.value)
								? 'font-medium text-blue-900'
								: 'text-gray-700'}
						>
							{activity.label}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Interests section -->
		<div class="rounded-lg bg-white p-4">
			<h3 class="mb-3 text-base font-semibold text-gray-900">관심사</h3>
			<div class="grid grid-cols-2 gap-2">
				{#each interestCategories as interest}
					<button
						onclick={() => toggleInterest(interest.value)}
						class="flex items-center gap-2 rounded-lg border p-3 text-sm transition-all {selectedInterests.includes(
							interest.value
						)
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200 hover:border-gray-300'}"
					>
						<span>{interest.icon}</span>
						<span
							class={selectedInterests.includes(interest.value)
								? 'font-medium text-blue-900'
								: 'text-gray-700'}
						>
							{interest.label}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Selected summary -->
		{#if selectedActivities.length > 0 || selectedInterests.length > 0}
			<div class="rounded-lg bg-blue-50 p-3">
				<p class="text-sm text-blue-600">선택된 항목</p>
				<p class="mt-1 text-sm font-medium text-blue-900">
					활동 {selectedActivities.length}개, 관심사 {selectedInterests.length}개
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

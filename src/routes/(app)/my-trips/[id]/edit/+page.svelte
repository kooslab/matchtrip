<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import arrowLeftUrl from '$lib/icons/icon-arrow-left-small-mono.svg';
	import { formatKoreanDate } from '$lib/utils/dateFormatter';

	let { data } = $props();
	let trip = $derived(data.trip);

	// Form states
	let minBudget = $state(trip.minBudget || 200);
	let maxBudget = $state(trip.maxBudget || 500);
	let customRequest = $state(trip.customRequest || '');
	let isSubmitting = $state(false);

	async function handleSubmit() {
		if (isSubmitting) return;

		isSubmitting = true;

		try {
			const response = await fetch(`/api/trips/${trip.id}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					minBudget,
					maxBudget,
					customRequest
				})
			});

			if (response.ok) {
				await goto(`/my-trips/${trip.id}`);
			} else {
				const error = await response.json();
				alert(error.message || '수정 중 오류가 발생했습니다.');
			}
		} catch (error) {
			console.error('Error updating trip:', error);
			alert('서버 오류가 발생했습니다.');
		} finally {
			isSubmitting = false;
		}
	}

	function handleCancel() {
		goto(`/my-trips/${trip.id}`);
	}
</script>

<svelte:head>
	<title>여행 수정 - {trip.destination?.city || '여행'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-200 bg-white">
		<div class="flex h-14 items-center px-4">
			<button onclick={handleCancel} class="mr-4">
				<img src={arrowLeftUrl} alt="Back" class="h-6 w-6" />
			</button>
			<h1 class="text-lg font-semibold text-gray-900">여행 수정</h1>
		</div>
	</header>

	<!-- Content -->
	<div class="px-4 py-4 pb-24">
		<!-- Trip Info (Read-only) -->
		<div class="mb-4 rounded-lg bg-white p-4">
			<h2 class="mb-3 text-base font-semibold text-gray-900">여행 정보</h2>
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600">목적지</span>
					<span class="text-gray-900">{trip.destination?.city}, {trip.destination?.country}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">여행 일정</span>
					<span class="text-gray-900"
						>{formatKoreanDate(trip.startDate)} - {formatKoreanDate(trip.endDate)}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">인원</span>
					<span class="text-gray-900"
						>성인 {trip.adultsCount}명{trip.childrenCount > 0
							? `, 아동 ${trip.childrenCount}명`
							: ''}</span
					>
				</div>
			</div>
		</div>

		<!-- Editable Fields -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-4"
		>
			<!-- Budget Range -->
			<div class="rounded-lg bg-white p-4">
				<h3 class="mb-3 text-base font-semibold text-gray-900">예산 범위</h3>
				<div class="flex items-center gap-2">
					<div class="flex-1">
						<label class="mb-1 block text-sm text-gray-600">최소 예산</label>
						<div class="relative">
							<input
								type="number"
								bind:value={minBudget}
								min="0"
								max="10000"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								placeholder="200"
							/>
							<span class="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500"
								>만원</span
							>
						</div>
					</div>
					<span class="mt-6 text-gray-400">~</span>
					<div class="flex-1">
						<label class="mb-1 block text-sm text-gray-600">최대 예산</label>
						<div class="relative">
							<input
								type="number"
								bind:value={maxBudget}
								min="0"
								max="10000"
								class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
								placeholder="500"
							/>
							<span class="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500"
								>만원</span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- Custom Request -->
			<div class="rounded-lg bg-white p-4">
				<h3 class="mb-3 text-base font-semibold text-gray-900">요청 사항</h3>
				<textarea
					bind:value={customRequest}
					rows="4"
					class="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					placeholder="특별한 요청사항이 있다면 적어주세요..."
				></textarea>
			</div>

			<!-- Action Buttons -->
			<div
				class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white pb-24"
			>
				<div class="mx-auto flex max-w-[430px] gap-3 p-4">
				<button
					type="button"
					onclick={handleCancel}
					class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
				>
					취소
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					class="flex-1 rounded-lg bg-blue-500 py-3 font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
				>
					{isSubmitting ? '저장 중...' : '저장하기'}
				</button>
				</div>
			</div>
		</form>
	</div>
</div>

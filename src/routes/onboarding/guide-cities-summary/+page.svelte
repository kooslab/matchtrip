<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ChevronLeft, X } from 'lucide-svelte';

	type SelectedCity = {
		id: string;
		name: string;
		nameEn: string;
		country: string;
		countryEn: string;
	};

	// Get selected cities from page data or use defaults for demo
	let selectedCities = $state<SelectedCity[]>([
		{ id: 'sapporo', name: '삿포로', nameEn: 'Sapporo', country: '일본', countryEn: 'Japan' },
		{ id: 'okinawa', name: '오키나와', nameEn: 'Okinawa', country: '일본', countryEn: 'Japan' }
	]);

	let isLoading = $state(false);
	let error = $state('');

	// Pre-fill with guide profile data if available
	$effect(() => {
		if ($page.data.guideProfile?.activityAreas) {
			selectedCities = $page.data.guideProfile.activityAreas;
		}
	});

	function removeCity(cityId: string) {
		selectedCities = selectedCities.filter(city => city.id !== cityId);
	}

	async function handleAddMore() {
		await goto('/onboarding/guide-cities');
	}

	async function handleSubmit() {
		if (selectedCities.length === 0) {
			error = '최소 하나 이상의 지역을 선택해주세요.';
			return;
		}

		isLoading = true;
		error = '';

		try {
			// Navigate to guide qualification page
			await goto('/onboarding/guide-qualification');
		} catch (err) {
			error = err instanceof Error ? err.message : '다음 단계로 진행할 수 없습니다.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="flex min-h-screen flex-col bg-white">
	<!-- Header -->
	<div class="px-4 py-2.5">
		<div class="flex items-center">
			<button
				onclick={() => history.back()}
				class="p-1"
			>
				<ChevronLeft class="h-6 w-6 text-gray-900" />
			</button>
		</div>
	</div>

	<!-- Content -->
	<div class="flex-1 px-4 pb-20 pt-3">
		<div class="space-y-10">
			<!-- Title -->
			<div class="space-y-2">
				<h1 class="text-[22px] font-bold text-gray-900">가이드 가능 지역</h1>
				<p class="text-sm text-gray-400">가이드가 가능한 지역을 추가해 주세요</p>
			</div>

			<!-- Selected cities display -->
			<div>
				<div class="rounded-[30px] border border-gray-100 bg-white px-5 py-2">
					<div class="flex items-center justify-between">
						<div class="flex flex-wrap items-center gap-2 py-2">
							{#if selectedCities.length > 0}
								{#each selectedCities as city}
									<div class="flex items-center gap-1 rounded bg-blue-50 px-2 py-1">
										<span class="text-[11px] font-medium text-blue-600">{city.name}</span>
										<button
											onclick={() => removeCity(city.id)}
											class="opacity-40 hover:opacity-60"
										>
											<X class="h-3 w-3 text-blue-600" />
										</button>
									</div>
								{/each}
							{:else}
								<span class="text-sm text-gray-400">선택된 지역이 없습니다</span>
							{/if}
						</div>
						<button
							onclick={handleAddMore}
							class="ml-2 whitespace-nowrap rounded-2xl bg-blue-600 px-3 py-2 text-[11px] font-medium text-white shadow-lg"
							style="background-image: linear-gradient(168.092deg, rgba(54, 41, 241, 0) 0%, rgba(220, 220, 220, 0.4) 100%)"
						>
							추가하기
						</button>
					</div>
				</div>
			</div>
		</div>

		{#if error}
			<div class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
				<p class="text-sm text-red-600">{error}</p>
			</div>
		{/if}
	</div>

	<!-- Bottom button -->
	<div class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm">
		<div class="border-t border-gray-100 px-4 py-2">
			<button
				onclick={handleSubmit}
				disabled={isLoading || selectedCities.length === 0}
				class="w-full rounded-lg py-3 font-medium text-white transition-colors {selectedCities.length > 0
					? 'bg-blue-600 hover:bg-blue-700'
					: 'cursor-not-allowed bg-gray-300'}"
			>
				{isLoading ? '저장 중...' : '다 음'}
			</button>
		</div>
	</div>
</div>
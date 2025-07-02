<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let selectedYear = $state(1990);
	let selectedMonth = $state(1);
	let selectedDay = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	let showPicker = $state(false);

	// Get current date for validation
	const currentYear = new Date().getFullYear();
	const minYear = currentYear - 100;
	const maxYear = currentYear - 14; // Must be at least 14 years old

	// Generate arrays for picker
	const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
	const months = Array.from({ length: 12 }, (_, i) => i + 1);
	
	const days = $derived(() => {
		const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
		return Array.from({ length: daysInMonth }, (_, i) => i + 1);
	});

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

	// Adjust day if it exceeds days in selected month
	$effect(() => {
		const maxDay = new Date(selectedYear, selectedMonth, 0).getDate();
		if (selectedDay > maxDay) {
			selectedDay = maxDay;
		}
	});

	async function handleSubmit() {
		isLoading = true;
		error = '';

		try {
			// Create ISO date string
			const birthDate = new Date(selectedYear, selectedMonth - 1, selectedDay).toISOString().split('T')[0];
			
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

			// Continue to email verification
			await goto('/onboarding/email');
		} catch (err) {
			error = err instanceof Error ? err.message : '생년월일 저장에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	function formatMonth(month: number): string {
		return `${month}월`;
	}

	function formatDay(day: number): string {
		return `${day}일`;
	}
</script>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
	<div class="max-w-md w-full">
		<!-- Progress indicator -->
		<div class="mb-8">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm text-gray-600">3/4</span>
			</div>
			<div class="h-2 bg-gray-200 rounded-full overflow-hidden">
				<div class="h-full bg-blue-600 rounded-full transition-all duration-300" style="width: 75%"></div>
			</div>
		</div>

		<div class="bg-white rounded-xl shadow-md p-8">
			<h1 class="text-2xl font-bold text-gray-900 mb-2">생년월일을 알려주세요</h1>
			<p class="text-gray-600 mb-8">서비스 이용을 위해 필요한 정보입니다</p>

			<div class="space-y-6">
				<!-- Date Display Button -->
				<button
					type="button"
					onclick={() => showPicker = !showPicker}
					class="w-full px-4 py-3 text-left border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all flex justify-between items-center"
				>
					<span>{displayDate}</span>
					<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</button>

				<!-- iOS Style Date Picker -->
				{#if showPicker}
					<div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
						<div class="flex gap-2 h-48 overflow-hidden">
							<!-- Year Picker -->
							<div class="flex-1 relative">
								<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-gray-200 rounded pointer-events-none z-10"></div>
								<div class="overflow-y-auto h-full scroll-smooth picker-scroll">
									<div class="py-20">
										{#each years as year}
											<button
												type="button"
												onclick={() => selectedYear = year}
												class="w-full py-2 text-center transition-all {selectedYear === year ? 'text-black font-semibold' : 'text-gray-400'}"
											>
												{year}년
											</button>
										{/each}
									</div>
								</div>
							</div>

							<!-- Month Picker -->
							<div class="flex-1 relative">
								<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-gray-200 rounded pointer-events-none z-10"></div>
								<div class="overflow-y-auto h-full scroll-smooth picker-scroll">
									<div class="py-20">
										{#each months as month}
											<button
												type="button"
												onclick={() => selectedMonth = month}
												class="w-full py-2 text-center transition-all {selectedMonth === month ? 'text-black font-semibold' : 'text-gray-400'}"
											>
												{formatMonth(month)}
											</button>
										{/each}
									</div>
								</div>
							</div>

							<!-- Day Picker -->
							<div class="flex-1 relative">
								<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-gray-200 rounded pointer-events-none z-10"></div>
								<div class="overflow-y-auto h-full scroll-smooth picker-scroll">
									<div class="py-20">
										{#each days() as day}
											<button
												type="button"
												onclick={() => selectedDay = day}
												class="w-full py-2 text-center transition-all {selectedDay === day ? 'text-black font-semibold' : 'text-gray-400'}"
											>
												{formatDay(day)}
											</button>
										{/each}
									</div>
								</div>
							</div>
						</div>
						
						<button
							type="button"
							onclick={() => showPicker = false}
							class="w-full mt-4 py-2 text-blue-600 font-medium"
						>
							완료
						</button>
					</div>
				{/if}

				{#if error}
					<div class="p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-sm text-red-600">{error}</p>
					</div>
				{/if}

				<button
					onclick={handleSubmit}
					disabled={isLoading}
					class="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
				>
					{#if isLoading}
						저장 중...
					{:else}
						계속하기
					{/if}
				</button>
			</div>

			<p class="text-center text-sm text-gray-500 mt-6">
				만 14세 이상만 가입할 수 있습니다
			</p>
		</div>
	</div>
</div>

<style>
	/* Hide scrollbar but keep functionality */
	.picker-scroll {
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE and Edge */
	}
	
	.picker-scroll::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}
</style>
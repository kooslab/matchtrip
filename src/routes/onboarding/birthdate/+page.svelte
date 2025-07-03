<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let selectedYear = $state(1990);
	let selectedMonth = $state(1);
	let selectedDay = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	
	// Visual selection states (what appears centered)
	let visualYear = $state(1990);
	let visualMonth = $state(1);
	let visualDay = $state(1);

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
			visualYear = selectedYear;
			visualMonth = selectedMonth;
			visualDay = selectedDay;
		}
	});

	// Scroll to selected values on mount
	$effect(() => {
		// Small delay to ensure DOM is ready
		setTimeout(() => {
			visualYear = selectedYear;
			visualMonth = selectedMonth;
			visualDay = selectedDay;
			scrollToSelected();
		}, 100);
	});

	function scrollToSelected() {
		const itemHeight = 40;
		
		// Scroll year picker
		const yearPicker = document.getElementById('year-picker');
		const yearIndex = years.indexOf(selectedYear);
		if (yearPicker && yearIndex !== -1) {
			const centerOffset = yearPicker.clientHeight / 2;
			yearPicker.scrollTop = yearIndex * itemHeight - centerOffset;
		}

		// Scroll month picker
		const monthPicker = document.getElementById('month-picker');
		if (monthPicker) {
			const centerOffset = monthPicker.clientHeight / 2;
			monthPicker.scrollTop = (selectedMonth - 1) * itemHeight - centerOffset;
		}

		// Scroll day picker
		const dayPicker = document.getElementById('day-picker');
		if (dayPicker) {
			const centerOffset = dayPicker.clientHeight / 2;
			dayPicker.scrollTop = (selectedDay - 1) * itemHeight - centerOffset;
		}
	}

	// Handle scroll snap
	function handlePickerScroll(e: Event, type: 'year' | 'month' | 'day') {
		const target = e.target as HTMLElement;
		const itemHeight = 40;
		const containerHeight = target.clientHeight;
		const centerOffset = containerHeight / 2;
		const scrollTop = target.scrollTop + centerOffset;
		const index = Math.round(scrollTop / itemHeight);
		
		// Update visual selection immediately
		if (type === 'year' && years[index]) {
			visualYear = years[index];
		} else if (type === 'month' && index >= 0 && index < 12) {
			visualMonth = index + 1;
		} else if (type === 'day') {
			const maxDay = days().length;
			const dayIndex = Math.min(Math.max(0, index), maxDay - 1);
			visualDay = dayIndex + 1;
		}
		
		// Clear any existing timeout
		if (target.dataset.scrollTimeout) {
			clearTimeout(parseInt(target.dataset.scrollTimeout));
		}
		
		// Set a new timeout for snap and final selection
		const timeoutId = setTimeout(() => {
			if (type === 'year' && years[index]) {
				selectedYear = years[index];
				target.scrollTop = index * itemHeight - centerOffset;
			} else if (type === 'month' && index >= 0 && index < 12) {
				selectedMonth = index + 1;
				target.scrollTop = index * itemHeight - centerOffset;
			} else if (type === 'day') {
				const maxDay = days().length;
				const dayIndex = Math.min(Math.max(0, index), maxDay - 1);
				selectedDay = dayIndex + 1;
				target.scrollTop = dayIndex * itemHeight - centerOffset;
			}
		}, 100);
		
		target.dataset.scrollTimeout = timeoutId.toString();
	}

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

			// Continue to signup complete page
			await goto('/onboarding/complete');
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

<div class="min-h-screen bg-white flex items-center justify-center px-4 py-12">
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

		<div class="space-y-8">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">생년월일을 알려주세요</h1>
				<p class="text-gray-600">서비스 이용을 위해 필요한 정보입니다</p>
			</div>

			<!-- iOS Style Date Picker Always Visible -->
			<div class="bg-gray-50 rounded-2xl p-4">
				<div class="flex gap-1 h-52 overflow-hidden">
					<!-- Year Picker -->
					<div class="flex-1 relative">
						<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-white/60 rounded-lg pointer-events-none z-10"></div>
						<div 
							class="overflow-y-auto h-full picker-scroll" 
							id="year-picker"
							onscroll={(e) => handlePickerScroll(e, 'year')}
						>
							<div class="py-24">
								{#each years as year}
									<div
										class="picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer {visualYear === year ? 'text-black font-medium text-lg' : 'text-gray-400 text-base'}"
										onclick={() => {
											selectedYear = year;
											visualYear = year;
											scrollToSelected();
										}}
									>
										{year}년
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Month Picker -->
					<div class="flex-1 relative">
						<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-white/60 rounded-lg pointer-events-none z-10"></div>
						<div 
							class="overflow-y-auto h-full picker-scroll" 
							id="month-picker"
							onscroll={(e) => handlePickerScroll(e, 'month')}
						>
							<div class="py-24">
								{#each months as month}
									<div
										class="picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer {visualMonth === month ? 'text-black font-medium text-lg' : 'text-gray-400 text-base'}"
										onclick={() => {
											selectedMonth = month;
											visualMonth = month;
											scrollToSelected();
										}}
									>
										{formatMonth(month)}
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Day Picker -->
					<div class="flex-1 relative">
						<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-white/60 rounded-lg pointer-events-none z-10"></div>
						<div 
							class="overflow-y-auto h-full picker-scroll" 
							id="day-picker"
							onscroll={(e) => handlePickerScroll(e, 'day')}
						>
							<div class="py-24">
								{#each days() as day}
									<div
										class="picker-item w-full h-10 flex items-center justify-center transition-all cursor-pointer {visualDay === day ? 'text-black font-medium text-lg' : 'text-gray-400 text-base'}"
										onclick={() => {
											selectedDay = day;
											visualDay = day;
											scrollToSelected();
										}}
									>
										{formatDay(day)}
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

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

			<p class="text-center text-sm text-gray-500 mt-4">
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
		scroll-snap-type: y mandatory;
		scroll-behavior: smooth;
	}
	
	.picker-scroll::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}
	
	.picker-item {
		scroll-snap-align: center;
		height: 40px;
	}
</style>
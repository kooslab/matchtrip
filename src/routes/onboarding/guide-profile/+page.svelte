<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Camera } from 'lucide-svelte';

	let selectedYear = $state(1990);
	let selectedMonth = $state(1);
	let selectedDay = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	let profileImageUrl = $state('');
	let uploadingImage = $state(false);
	let residenceArea = $state('');
	let showDatePicker = $state(false);

	// Visual selection states (what appears centered)
	let visualYear = $state(1990);
	let visualMonth = $state(1);
	let visualDay = $state(1);

	// Track which items are in the selection area
	let inSelectionYear = $state<number | null>(null);
	let inSelectionMonth = $state<number | null>(null);
	let inSelectionDay = $state<number | null>(null);

	// Prevent recursive scroll updates
	let isSnapping = false;

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

	// Generate avatar placeholder
	function getAvatarUrl(name: string) {
		const initials = name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase();
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3B82F6&color=fff&size=200&font-size=0.4&bold=true`;
	}

	// Pre-fill with existing data if available
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

		// Pre-fill profile image if exists
		if ($page.data.guideProfile?.profileImageUrl) {
			profileImageUrl = $page.data.guideProfile.profileImageUrl;
		}
	});

	// Scroll to selected values on mount
	$effect(() => {
		// Small delay to ensure DOM is ready
		setTimeout(() => {
			visualYear = selectedYear;
			visualMonth = selectedMonth;
			visualDay = selectedDay;
			inSelectionYear = selectedYear;
			inSelectionMonth = selectedMonth;
			inSelectionDay = selectedDay;
			scrollToSelected();

			// Update initial styles
			setTimeout(() => {
				const yearPicker = document.getElementById('year-picker');
				const monthPicker = document.getElementById('month-picker');
				const dayPicker = document.getElementById('day-picker');

				if (yearPicker) updateItemStyles(yearPicker, 'year');
				if (monthPicker) updateItemStyles(monthPicker, 'month');
				if (dayPicker) updateItemStyles(dayPicker, 'day');
			}, 200);
		}, 100);
	});

	function scrollToSelected() {
		const itemHeight = 40;
		const padding = 96;

		// Scroll year picker
		const yearPicker = document.getElementById('year-picker');
		const yearIndex = years.indexOf(selectedYear);
		if (yearPicker && yearIndex !== -1) {
			const centerPosition = yearPicker.clientHeight / 2;
			yearPicker.scrollTop = yearIndex * itemHeight - centerPosition + padding + itemHeight / 2;
		}

		// Scroll month picker
		const monthPicker = document.getElementById('month-picker');
		if (monthPicker) {
			const centerPosition = monthPicker.clientHeight / 2;
			monthPicker.scrollTop =
				(selectedMonth - 1) * itemHeight - centerPosition + padding + itemHeight / 2;
		}

		// Scroll day picker
		const dayPicker = document.getElementById('day-picker');
		if (dayPicker) {
			const centerPosition = dayPicker.clientHeight / 2;
			dayPicker.scrollTop =
				(selectedDay - 1) * itemHeight - centerPosition + padding + itemHeight / 2;
		}
	}

	function updateItemStyles(container: HTMLElement, type: 'year' | 'month' | 'day') {
		const items = container.querySelectorAll('.picker-item');
		const containerRect = container.getBoundingClientRect();
		const centerY = containerRect.top + containerRect.height / 2;
		const threshold = 40; // Height of each item

		items.forEach((item) => {
			const itemRect = item.getBoundingClientRect();
			const itemCenterY = itemRect.top + itemRect.height / 2;
			const distance = Math.abs(centerY - itemCenterY);

			if (distance < threshold / 2) {
				// Item is in selection area - make it large and dark
				item.classList.remove('text-gray-400', 'text-base');
				item.classList.add('text-gray-900', 'text-xl', 'font-medium');

				// Update the in-selection state
				const value = parseInt(item.getAttribute(`data-${type}`) || '0');
				if (type === 'year') inSelectionYear = value;
				else if (type === 'month') inSelectionMonth = value;
				else if (type === 'day') inSelectionDay = value;
			} else {
				// Item is outside selection area - keep it small and light
				item.classList.remove('text-gray-900', 'text-xl', 'font-medium');
				item.classList.add('text-gray-400', 'text-base');
			}
		});
	}

	function handleScroll(e: Event, type: 'year' | 'month' | 'day') {
		if (isSnapping) return;

		const container = e.target as HTMLElement;
		updateItemStyles(container, type);

		// Clear existing timeout
		clearTimeout((container as any).scrollTimeout);

		// Set new timeout for snapping
		(container as any).scrollTimeout = setTimeout(() => {
			snapToNearest(container, type);
		}, 150);
	}

	function snapToNearest(container: HTMLElement, type: 'year' | 'month' | 'day') {
		isSnapping = true;
		const itemHeight = 40;
		const padding = 96;
		const scrollTop = container.scrollTop;
		const centerPosition = container.clientHeight / 2;

		// Calculate which item should be centered
		const index = Math.round((scrollTop + centerPosition - padding - itemHeight / 2) / itemHeight);

		// Get the actual value for that index
		let value: number;
		if (type === 'year') {
			value = years[Math.max(0, Math.min(index, years.length - 1))];
			selectedYear = value;
			visualYear = value;
		} else if (type === 'month') {
			value = Math.max(1, Math.min(index + 1, 12));
			selectedMonth = value;
			visualMonth = value;
		} else {
			value = Math.max(1, Math.min(index + 1, days().length));
			selectedDay = value;
			visualDay = value;
		}

		// Smooth scroll to snap position
		const targetScrollTop = index * itemHeight - centerPosition + padding + itemHeight / 2;
		container.scrollTo({
			top: targetScrollTop,
			behavior: 'smooth'
		});

		// Update styles after snap
		setTimeout(() => {
			updateItemStyles(container, type);
			isSnapping = false;
		}, 300);
	}

	// Format helpers
	function formatMonth(month: number): string {
		return `${month}월`;
	}

	function formatDay(day: number): string {
		return `${day}일`;
	}

	// Handle profile image upload
	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			error = '이미지는 JPG, PNG, WebP 형식만 가능합니다.';
			return;
		}

		// Validate file size (5MB)
		if (file.size > 5 * 1024 * 1024) {
			error = '이미지 크기는 5MB 이하여야 합니다.';
			return;
		}

		uploadingImage = true;
		error = '';

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', 'guide-profile');

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || '이미지 업로드에 실패했습니다.');
			}

			const data = await response.json();
			profileImageUrl = data.url;
		} catch (err) {
			error = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
		} finally {
			uploadingImage = false;
		}
	}

	async function handleSubmit() {
		if (isLoading) return;

		isLoading = true;
		error = '';

		try {
			// Save birthdate
			const birthDate = new Date(selectedYear, selectedMonth - 1, selectedDay).toISOString();

			const userResponse = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ birthDate })
			});

			if (!userResponse.ok) {
				throw new Error('생년월일 저장에 실패했습니다.');
			}

			// Save guide profile (image and residence)
			const profileData: any = {};
			if (profileImageUrl) {
				profileData.profileImageUrl = profileImageUrl;
			}
			if (residenceArea.trim()) {
				profileData.location = residenceArea.trim();
			}
			
			if (Object.keys(profileData).length > 0) {
				const profileResponse = await fetch('/api/profile/guide', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(profileData)
				});

				if (!profileResponse.ok) {
					throw new Error('프로필 저장에 실패했습니다.');
				}
			}

			// Navigate to complete page
			await goto('/onboarding/complete');
		} catch (err) {
			error = err instanceof Error ? err.message : '저장에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

	// Check if form is valid
	const canSubmit = $derived(() => {
		return !isLoading && !uploadingImage;
	});
</script>

<div class="min-h-screen bg-white px-4 py-12">
	<div class="mx-auto max-w-md">
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
				<h1 class="mb-2 text-2xl font-bold text-gray-900">기본 정보 입력</h1>
				<p class="text-gray-600">프로필 사진과 생년월일을 입력해주세요</p>
			</div>

			<!-- Profile Image Upload -->
			<div class="flex flex-col items-center space-y-4">
				<div class="relative">
					<div class="h-32 w-32 overflow-hidden rounded-full bg-gray-200">
						{#if profileImageUrl}
							<img src={profileImageUrl} alt="프로필 사진" class="h-full w-full object-cover" />
						{:else}
							<img
								src={getAvatarUrl($page.data.user?.name || '가이드')}
								alt="기본 프로필"
								class="h-full w-full object-cover"
							/>
						{/if}
					</div>
					<label
						for="profile-image"
						class="absolute right-0 bottom-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700"
					>
						<Camera class="h-5 w-5" />
						<input
							id="profile-image"
							type="file"
							accept="image/jpeg,image/png,image/webp"
							onchange={handleImageUpload}
							disabled={uploadingImage}
							class="hidden"
						/>
					</label>
				</div>
				{#if uploadingImage}
					<p class="text-sm text-gray-500">업로드 중...</p>
				{/if}
			</div>

			<!-- Email Display -->
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
				<div class="px-4 py-3 bg-gray-50 rounded-lg text-gray-600">
					{$page.data.user?.email || ''}
				</div>
			</div>

			<!-- Residence Area -->
			<div>
				<label for="residence" class="block text-sm font-medium text-gray-700 mb-2">거주지역</label>
				<input
					id="residence"
					type="text"
					bind:value={residenceArea}
					placeholder="도시, 국가"
					class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					disabled={isLoading}
				/>
			</div>

			<!-- Birth Date Picker -->
			<div class="space-y-4">
				<label class="block text-sm font-medium text-gray-700">생년월일</label>

				<button
					type="button"
					onclick={() => showDatePicker = !showDatePicker}
					class="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 transition-colors"
				>
					<div class="text-center text-sm text-gray-600">{displayDate}</div>
				</button>

				{#if showDatePicker}
				<!-- iOS-style date picker -->
				<div class="relative overflow-hidden rounded-lg border border-gray-200 bg-white">
					<!-- Selection highlight area -->
					<div
						class="pointer-events-none absolute inset-x-0 top-1/2 z-10 h-10 -translate-y-1/2 border-y-2 border-blue-400 bg-blue-50/30"
					></div>

					<div class="flex h-60">
						<!-- Year picker -->
						<div class="flex-1 overflow-hidden">
							<div
								id="year-picker"
								class="scrollbar-hide h-full overflow-y-auto px-4"
								onscroll={(e) => handleScroll(e, 'year')}
							>
								<div class="h-24"></div>
								{#each years as year}
									<div
										class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base text-gray-400 transition-all"
										data-year={year}
										onclick={() => {
											selectedYear = year;
											visualYear = year;
											inSelectionYear = year;
											scrollToSelected();
											setTimeout(() => {
												const yearPicker = document.getElementById('year-picker');
												if (yearPicker) updateItemStyles(yearPicker, 'year');
											}, 150);
										}}
									>
										{year}년
									</div>
								{/each}
								<div class="h-24"></div>
							</div>
						</div>

						<!-- Month picker -->
						<div class="flex-1 overflow-hidden border-x border-gray-200">
							<div
								id="month-picker"
								class="scrollbar-hide h-full overflow-y-auto px-4"
								onscroll={(e) => handleScroll(e, 'month')}
							>
								<div class="h-24"></div>
								{#each months as month}
									<div
										class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base text-gray-400 transition-all"
										data-month={month}
										onclick={() => {
											selectedMonth = month;
											visualMonth = month;
											inSelectionMonth = month;
											scrollToSelected();
											setTimeout(() => {
												const monthPicker = document.getElementById('month-picker');
												if (monthPicker) updateItemStyles(monthPicker, 'month');
											}, 150);
										}}
									>
										{formatMonth(month)}
									</div>
								{/each}
								<div class="h-24"></div>
							</div>
						</div>

						<!-- Day picker -->
						<div class="flex-1 overflow-hidden">
							<div
								id="day-picker"
								class="scrollbar-hide h-full overflow-y-auto px-4"
								onscroll={(e) => handleScroll(e, 'day')}
							>
								<div class="h-24"></div>
								{#each days() as day}
									<div
										class="picker-item flex h-10 w-full cursor-pointer items-center justify-center text-base text-gray-400 transition-all"
										data-day={day}
										onclick={() => {
											selectedDay = day;
											visualDay = day;
											inSelectionDay = day;
											scrollToSelected();
											setTimeout(() => {
												const dayPicker = document.getElementById('day-picker');
												if (dayPicker) updateItemStyles(dayPicker, 'day');
											}, 150);
										}}
									>
										{formatDay(day)}
									</div>
								{/each}
								<div class="h-24"></div>
							</div>
						</div>
					</div>
				</div>
				{/if}
			</div>

			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<!-- Submit button -->
			<button
				onclick={handleSubmit}
				disabled={!canSubmit()}
				class="w-full rounded-lg py-3 font-medium text-white transition-colors {canSubmit()
					? 'bg-blue-600 hover:bg-blue-700'
					: 'cursor-not-allowed bg-gray-300'}"
			>
				{isLoading ? '저장 중...' : '다음'}
			</button>

			<!-- Skip option for profile image -->
			{#if !profileImageUrl && !uploadingImage}
				<p class="text-center text-sm text-gray-500">프로필 사진은 나중에 추가할 수 있습니다</p>
			{/if}
		</div>
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>

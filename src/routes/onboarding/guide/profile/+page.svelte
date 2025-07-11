<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import { DatePicker, Dialog } from 'bits-ui';
	import { CalendarDate, CalendarDateTime, ZonedDateTime, now, getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import iconArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';
	import iconUser from '$lib/icons/icon-user-mono.svg';
	import iconCamera from '$lib/icons/icon-camera-mono.svg';
	import iconXCircle from '$lib/icons/icon-x-circle-mono.svg';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get data from store
	let storeData = $state({ name: '', phone: '' });
	
	onMount(() => {
		const unsubscribe = onboardingStore.subscribe(data => {
			storeData = data;
			// If no data in store, redirect back
			if (!data.name || !data.phone) {
				goto('/onboarding/guide');
			}
		});
		
		// Initialize dateValue if birthDate exists
		if (formData.birthDate) {
			const parts = formData.birthDate.split('-');
			if (parts.length === 3) {
				dateValue = new CalendarDate(
					parseInt(parts[0]), 
					parseInt(parts[1]), 
					parseInt(parts[2])
				);
			}
		}
		
		return unsubscribe;
	});

	// Form data
	let formData = $state({
		nickname: '',
		frequentArea: '',
		email: data.user?.email || '',
		birthDate: '',
		gender: ''
	});

	let profileImageUrl = $state('');
	let uploadingImage = $state(false);

	let isLoading = $state(false);
	let dateValue = $state<CalendarDate | undefined>(undefined);
	let dateDialogOpen = $state(false);
	let calendarPlaceholder = $state<CalendarDate>(today(getLocalTimeZone()));

	// Validation
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Make canProceed reactive
	let canProceed = $derived(
		formData.nickname.trim().length >= 2 &&
		formData.frequentArea.trim().length > 0 &&
		formData.birthDate.length > 0
	);
	
	// Debug logging for canProceed
	$effect(() => {
		console.log('canProceed updated:', canProceed, {
			nickname: formData.nickname,
			frequentArea: formData.frequentArea,
			birthDate: formData.birthDate
		});
	});

	// Handle profile image upload
	function handleImageClick() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'image/jpeg,image/png,image/webp';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (file) {
				// Validate file size (5MB limit)
				if (file.size > 5 * 1024 * 1024) {
					alert('파일 크기는 5MB를 초과할 수 없습니다.');
					return;
				}

				uploadingImage = true;

				try {
					const formData = new FormData();
					formData.append('file', file);
					formData.append('type', 'guide-profile');

					const response = await fetch('/api/upload', {
						method: 'POST',
						body: formData
					});

					if (response.ok) {
						const data = await response.json();
						profileImageUrl = data.url;
					} else {
						const error = await response.json();
						alert(error.error || '이미지 업로드에 실패했습니다.');
					}
				} catch (error) {
					console.error('Upload error:', error);
					alert('이미지 업로드 중 오류가 발생했습니다.');
				} finally {
					uploadingImage = false;
				}
			}
		};
		input.click();
	}

	// Handle next
	async function handleNext() {
		if (!canProceed) return;

		isLoading = true;

		try {
			// Store profile data temporarily in store
			onboardingStore.setData({
				nickname: formData.nickname,
				frequentArea: formData.frequentArea,
				birthDate: formData.birthDate,
				gender: formData.gender,
				profileImageUrl: profileImageUrl
			});

			// Navigate to next step
			await goto('/onboarding/guide/destinations');
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// Handle back
	function handleBack() {
		goto('/onboarding/guide');
	}

	// Handle date change is now done directly in the DatePicker onValueChange

	// Auto-scroll to selected year when dialog opens
	$effect(() => {
		if (dateDialogOpen) {
			setTimeout(() => {
				const selectedYearElement = document.querySelector('.year-selector-item.selected');
				if (selectedYearElement) {
					selectedYearElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
				}
			}, 100);
		}
	});

	// Format date for display
	function formatBirthDate(dateString: string): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${year}년 ${month}월 ${day}일`;
	}

	// Korean weekday names
	const koreanWeekdays = ['일', '월', '화', '수', '목', '금', '토'];
	
	// Convert weekday to Korean
	function getKoreanWeekday(weekday: string): string {
		const weekdayMap: Record<string, string> = {
			'Su': '일',
			'Mo': '월', 
			'Tu': '화',
			'We': '수',
			'Th': '목',
			'Fr': '금',
			'Sa': '토',
			'Sunday': '일',
			'Monday': '월',
			'Tuesday': '화',
			'Wednesday': '수',
			'Thursday': '목',
			'Friday': '금',
			'Saturday': '토'
		};
		return weekdayMap[weekday] || weekday.slice(0, 2);
	}

	// Handle Enter key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			// Prevent form submission if inside a form
			event.preventDefault();
			
			// Only proceed if the button would be enabled
			if (canProceed && !isLoading) {
				handleNext();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<style>
	/* Custom scrollbar hide utility */
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	/* Date Picker Calendar Split */
	:global(.date-picker-calendar-split) {
		flex: 1;
		overflow-y: auto;
		padding: 20px 16px 20px 0px;
	}

	/* Custom animations */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translate(-50%, -45%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}

	.animate-slideUp {
		animation: slideUp 0.3s ease-out;
	}

	/* Date picker button styles */
	:global(.date-picker-nav-button) {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background-color: transparent;
		border: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-primary);
		transition: all 0.2s ease;
	}

	:global(.date-picker-nav-button:hover) {
		background-color: rgba(0, 0, 0, 0.04);
	}

	:global(.date-picker-day) {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		border: 1px solid transparent;
		background-color: transparent;
		color: var(--color-text-primary);
		font-size: 13px;
		font-weight: 400;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.date-picker-day:hover:not([data-disabled]):not([data-outside-month])) {
		background-color: rgba(16, 149, 244, 0.08);
		border-color: #1095f4;
	}

	:global(.date-picker-day[data-selected]) {
		background-color: #1095f4;
		color: #ffffff;
		font-weight: 600;
	}

	:global(.date-picker-day[data-disabled]) {
		color: #c8d2d8;
		cursor: not-allowed;
	}

	:global(.date-picker-day[data-outside-month]) {
		color: #c8d2d8;
		pointer-events: none;
	}

	:global(.date-picker-day[data-today]:not([data-selected])) {
		border-color: #1095f4;
		font-weight: 500;
	}
</style>

<div class="min-h-screen bg-white relative overflow-hidden">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white/92 backdrop-blur-md h-14 border-b-2 border-gray-100">
		<div class="flex items-center justify-between h-full px-4 relative">
			<button class="w-6 h-6 cursor-pointer bg-transparent border-none p-0 flex items-center justify-center" onclick={handleBack}>
				<img src={iconArrowBack} alt="뒤로가기" />
			</button>
			<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
				<div class="absolute bottom-0 left-0 w-1/3 h-0.5 bg-color-primary transition-all duration-300"></div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="px-[16px] pt-[24px] pb-[120px]">
		<!-- Title -->
		<div class="mb-[40px]">
			<h1 class="font-bold text-[22px] leading-8 text-primary mb-[8px]">기본 정보</h1>
			<p class="font-normal text-[13px] leading-5 text-secondary">사용자를 파악할 수 있는 정보를 입력해주세요</p>
		</div>

		<!-- Profile Image -->
		<div class="flex justify-center mb-[40px]">
			<div class="relative w-[124px] h-[124px] cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]" onclick={handleImageClick} role="button" tabindex="0" onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleImageClick();
				}
			}}>
				<div class="w-[124px] h-[124px] rounded-[62px] bg-gray-100 flex items-center justify-center overflow-hidden transition-colors duration-200 hover:bg-gray-200">
					{#if profileImageUrl}
						<img src={profileImageUrl} alt="프로필 이미지" class="w-full h-full object-cover" />
					{:else}
						<img src={iconUser} alt="프로필 이미지" class="w-[68px] h-[68px]" />
					{/if}
				</div>
				<button class="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-gray-50 flex items-center justify-center cursor-pointer shadow-md" onclick={(e) => {
					e.stopPropagation();
					handleImageClick();
				}} disabled={uploadingImage} tabindex="-1">
					{#if uploadingImage}
						<div class="w-4 h-4 border-2 border-gray-300 border-t-color-primary rounded-full animate-spin"></div>
					{:else}
						<img src={iconCamera} alt="사진 추가" class="w-4 h-4" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Form -->
		<div class="flex flex-col gap-6">
			<!-- Nickname -->
			<div class="flex flex-col gap-2">
				<label for="nickname" class="font-medium text-[11px] leading-4 text-primary">닉네임</label>
				<div class="relative w-full">
					<input
						id="nickname"
						type="text"
						class="w-full h-12 bg-gray-50 border border-gray-50 rounded-[9px] px-5 pr-10 font-normal text-[13px] leading-5 text-primary outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-color-primary focus:bg-blue-50/40 {formData.nickname ? 'border-color-primary' : ''}"
						placeholder="메치트립"
						bind:value={formData.nickname}
						maxlength="20"
					/>
					{#if formData.nickname}
						<button
							type="button"
							class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer bg-transparent border-none p-0 flex items-center justify-center opacity-100 transition-opacity duration-200"
							onclick={() => formData.nickname = ''}
							aria-label="닉네임 지우기"
						>
							<img src={iconXCircle} alt="" class="w-full h-full" />
						</button>
					{/if}
				</div>
			</div>

			<!-- Frequent Area -->
			<div class="flex flex-col gap-2">
				<label for="frequentArea" class="font-medium text-[11px] leading-4 text-primary">자주 가는 지역</label>
				<div class="relative w-full">
					<input
						id="frequentArea"
						type="text"
						class="w-full h-12 bg-gray-50 border border-gray-50 rounded-[9px] px-5 font-normal text-[13px] leading-5 text-primary outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-color-primary focus:bg-blue-50/40 {formData.frequentArea ? 'border-color-primary' : ''}"
						placeholder="베를린, 독일"
						bind:value={formData.frequentArea}
					/>
				</div>
			</div>

			<!-- Email -->
			<div class="flex flex-col gap-2">
				<label for="email" class="font-medium text-[11px] leading-4 text-primary">이메일</label>
				<div class="relative w-full">
					<input
						id="email"
						type="email"
						class="w-full h-12 bg-gray-100 border border-gray-50 rounded-[9px] px-5 font-normal text-[13px] leading-5 text-primary outline-none cursor-not-allowed"
						placeholder="이메일을 입력해 주세요"
						value={formData.email}
						readonly
						disabled
					/>
				</div>
			</div>

			<!-- Birth Date -->
			<div class="flex flex-col gap-2">
				<label for="birthdate" class="font-medium text-[11px] leading-4 text-primary">생년월일</label>
				<div class="relative w-full">
					<input
						id="birthdate"
						type="text"
						class="w-full h-12 bg-gray-50 border border-gray-50 rounded-[9px] px-5 pr-10 font-normal text-[13px] leading-5 text-primary outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-color-primary focus:bg-blue-50/40 cursor-pointer {formData.birthDate ? 'border-color-primary' : ''}"
						placeholder="생년월일을 선택해 주세요"
						value={formData.birthDate ? formatBirthDate(formData.birthDate) : ''}
						readonly
						onclick={() => dateDialogOpen = true}
					/>
					<button
						type="button"
						class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
						onclick={() => dateDialogOpen = true}
						aria-label="날짜 선택"
					>
						<Calendar size={16} class="text-secondary" />
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" style="z-index: 40; box-shadow: 0px -5px 20px rgba(0, 0, 0, 0.05); display: block; visibility: visible;">
		<div style="padding: 8px; padding-bottom: calc(8px + env(safe-area-inset-bottom, 8px));">
			<button 
				class="w-full font-semibold text-white cursor-pointer transition-colors duration-200" 
				style="height: 48px; border-radius: 9px; font-size: 14px; line-height: 20px; background-color: {canProceed && !isLoading ? '#1095f4' : '#8ea0ac'}; {canProceed && !isLoading ? '' : 'cursor: not-allowed; opacity: 0.7;'}"
				disabled={!canProceed || isLoading}
				onclick={handleNext}
			>
				{isLoading ? '처리중...' : '다 음'}
			</button>
		</div>
	</div>

	<!-- Date Picker Dialog -->
	<Dialog.Root bind:open={dateDialogOpen}>
		<Dialog.Portal>
			<Dialog.Overlay class="fixed inset-0 bg-black/60 animate-fadeIn" style="z-index: 50;" />
			<Dialog.Content class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] max-w-[540px] bg-transparent animate-slideUp" style="z-index: 51;">
				<div class="flex bg-white rounded-2xl border border-gray-100 shadow-[0_25px_50px_rgba(0,0,0,0.25)] overflow-hidden h-[440px]">
					<!-- Year selector (left side) -->
					<div class="w-16 bg-gray-50 border-r border-gray-100 flex flex-col">
						<div class="px-[8px] py-[12px] text-xs font-semibold text-primary text-center border-b border-gray-100 bg-white">연도 선택</div>
						<div class="flex-1 overflow-y-auto py-2 scrollbar-hide">
							{#each Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i) as year}
								<button
									type="button"
									class="w-full py-2 px-1 text-center text-[13px] font-normal text-primary bg-transparent border-none cursor-pointer transition-all duration-200 hover:bg-blue-50 hover:text-color-primary {calendarPlaceholder.year === year ? 'bg-color-primary text-white font-semibold hover:bg-color-primary hover:text-white' : ''}"
									onclick={() => {
										// Create new CalendarDate with selected year
										calendarPlaceholder = new CalendarDate(year, calendarPlaceholder.month, calendarPlaceholder.day);
									}}
								>
									{year}
								</button>
							{/each}
						</div>
					</div>
					
					<!-- Calendar (right side) -->
					<DatePicker.Root 
						bind:value={dateValue} 
						bind:placeholder={calendarPlaceholder} 
						weekdayFormat="short" 
						fixedWeeks={true} 
						weekStartsOn={0}
						onValueChange={(value) => {
							if (value) {
								// Update form data immediately when date is selected
								formData.birthDate = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
								// Update the dateValue state as well
								dateValue = value;
								// Close dialog after a small delay to ensure state updates
								setTimeout(() => {
									dateDialogOpen = false;
								}, 50);
							}
						}}
					>
						<DatePicker.Calendar class="date-picker-calendar-split">
							{#snippet children({ months, weekdays })}
								<DatePicker.Header class="mb-4">
									<div class="flex items-center justify-between">
										<DatePicker.PrevButton class="date-picker-nav-button">
											<ChevronLeft class="w-5 h-5" />
										</DatePicker.PrevButton>
										<DatePicker.Heading class="text-[15px] font-semibold text-primary">
											{#snippet children({ headingValue })}
												{headingValue.year}년 {headingValue.month}월
											{/snippet}
										</DatePicker.Heading>
										<DatePicker.NextButton class="date-picker-nav-button">
											<ChevronRight class="w-5 h-5" />
										</DatePicker.NextButton>
									</div>
								</DatePicker.Header>
								<div class="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
									{#each months as month (month.value)}
										<DatePicker.Grid class="w-full border-collapse select-none space-y-1">
											<DatePicker.GridHead>
												<DatePicker.GridRow class="mb-1 flex w-full gap-0.5">
													{#each weekdays as day (day)}
														<DatePicker.HeadCell class="text-secondary font-normal! w-9 rounded-md text-xs">
															<div>{getKoreanWeekday(day)}</div>
														</DatePicker.HeadCell>
													{/each}
												</DatePicker.GridRow>
											</DatePicker.GridHead>
											<DatePicker.GridBody>
												{#each month.weeks as weekDates (weekDates)}
													<DatePicker.GridRow class="flex w-full gap-0.5">
														{#each weekDates as date (date)}
															<DatePicker.Cell
																{date}
																month={month.value}
																class="p-0! relative size-9 text-center text-sm"
															>
																<DatePicker.Day class="date-picker-day">
																	<div class="bg-color-primary group-data-selected:bg-white group-data-today:block absolute top-[5px] hidden size-1 rounded-full transition-all"></div>
																	{date.day}
																</DatePicker.Day>
															</DatePicker.Cell>
														{/each}
													</DatePicker.GridRow>
												{/each}
											</DatePicker.GridBody>
										</DatePicker.Grid>
									{/each}
								</div>
							{/snippet}
						</DatePicker.Calendar>
					</DatePicker.Root>
				</div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>

</div>
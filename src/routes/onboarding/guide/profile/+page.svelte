<script lang="ts">
	import { goto, afterNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import {
		CalendarDate,
		CalendarDateTime,
		ZonedDateTime,
		now,
		getLocalTimeZone,
		parseDate,
		today
	} from '@internationalized/date';
	import { Calendar } from 'lucide-svelte';
	import DatePickerDialog from '$lib/components/DatePickerDialog.svelte';
	import iconArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';
	import iconUser from '$lib/icons/icon-user-mono.svg';
	import iconCamera from '$lib/icons/icon-camera-mono.svg';
	import iconXCircle from '$lib/icons/icon-x-circle-mono.svg';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	
	// Use afterNavigate for reliable scroll reset
	afterNavigate(() => {
		window.scrollTo(0, 0);
	});

	// Get initial data from store
	let storeData = onboardingStore.get();

	// Form data - initialize with store data if available
	let formData = $state({
		nickname: storeData.nickname || '',
		frequentArea: storeData.frequentArea || '',
		email: data.user?.email || storeData.email || '',
		birthDate: storeData.birthDate || '',
		gender: storeData.gender || '',
		bio: storeData.bio || ''
	});

	// Also restore profile image if it exists
	let profileImageUrl = $state(storeData.profileImageUrl || '');
	let uploadingImage = $state(false);

	onMount(() => {
		// Additional scroll reset in onMount as backup
		window.scrollTo(0, 0);
		document.documentElement.scrollTop = 0;
		
		// Check if required data exists
		if (!storeData.name || !storeData.phone) {
			goto('/onboarding/guide');
			return;
		}

		// Initialize dateValue if birthDate exists
		if (formData.birthDate) {
			const parts = formData.birthDate.split('-');
			if (parts.length === 3) {
				dateValue = new CalendarDate(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
				// Update calendar placeholder to show the correct month/year
				calendarPlaceholder = dateValue;
			}
		}
	});

	let isLoading = $state(false);
	let dateValue = $state<CalendarDate | undefined>(undefined);
	let dateDialogOpen = $state(false);

	// Calculate the maximum year (user must be at least 14 years old)
	const currentYear = new Date().getFullYear();
	const maxYear = currentYear - 14;
	const minYear = currentYear - 100;

	// Set placeholder to a valid date for 14+ year olds
	let calendarPlaceholder = $state<CalendarDate>(new CalendarDate(maxYear, 1, 1));

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
	// $effect(() => {
	// 	console.log('canProceed updated:', canProceed, {
	// 		nickname: formData.nickname,
	// 		frequentArea: formData.frequentArea,
	// 		birthDate: formData.birthDate
	// 	});
	// });

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
				bio: formData.bio,
				profileImageUrl: profileImageUrl
			});

			// Navigate to next step
			await goto('/onboarding/guide/destinations', { replaceState: false, noScroll: false });
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// Handle back
	function handleBack() {
		// Save current form data to store before going back
		onboardingStore.setData({
			nickname: formData.nickname,
			frequentArea: formData.frequentArea,
			email: formData.email,
			birthDate: formData.birthDate,
			gender: formData.gender,
			profileImageUrl: profileImageUrl
		});

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
			Su: '일',
			Mo: '월',
			Tu: '화',
			We: '수',
			Th: '목',
			Fr: '금',
			Sa: '토',
			Sunday: '일',
			Monday: '월',
			Tuesday: '화',
			Wednesday: '수',
			Thursday: '목',
			Friday: '금',
			Saturday: '토'
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

<div class="relative min-h-screen overflow-hidden bg-white">
	<!-- Header -->
	<header class="sticky top-0 z-10 h-14 border-b-2 border-gray-100 bg-white/92 backdrop-blur-md">
		<div class="relative flex h-full items-center justify-between px-4">
			<button
				class="flex h-6 w-6 cursor-pointer items-center justify-center border-none bg-transparent p-0"
				onclick={handleBack}
			>
				<img src={iconArrowBack} alt="뒤로가기" />
			</button>
			<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-gray-100">
				<div
					class="bg-color-primary absolute bottom-0 left-0 h-0.5 w-1/3 transition-all duration-300"
				></div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="px-[16px] pt-[24px] pb-32">
		<!-- Title -->
		<div class="mb-[40px]">
			<h1 class="text-primary mb-[8px] text-[22px] leading-8 font-bold">기본 정보</h1>
			<p class="text-secondary text-[13px] leading-5 font-normal">
				사용자를 파악할 수 있는 정보를 입력해주세요
			</p>
		</div>

		<!-- Profile Image -->
		<div class="mb-[40px] flex justify-center">
			<div
				class="relative h-[124px] w-[124px] transition-transform duration-200 {uploadingImage ? 'cursor-wait' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'}"
				onclick={uploadingImage ? undefined : handleImageClick}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (!uploadingImage && (e.key === 'Enter' || e.key === ' ')) {
						e.preventDefault();
						handleImageClick();
					}
				}}
			>
				<div
					class="relative flex h-[124px] w-[124px] items-center justify-center overflow-hidden rounded-[62px] bg-gray-100 transition-colors duration-200 hover:bg-gray-200"
				>
					{#if profileImageUrl}
						<img src={profileImageUrl} alt="프로필 이미지" class="h-full w-full object-cover" />
					{:else}
						<img src={iconUser} alt="프로필 이미지" class="h-[68px] w-[68px]" />
					{/if}
					
					{#if uploadingImage}
						<div class="absolute inset-0 flex items-center justify-center rounded-[62px] bg-white/80 backdrop-blur-sm">
							<div class="flex flex-col items-center gap-2">
								<div class="h-8 w-8 animate-spin rounded-full border-3 border-gray-300 border-t-blue-500"></div>
								<span class="text-xs text-gray-600">업로드 중...</span>
							</div>
						</div>
					{/if}
				</div>
				<button
					class="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-gray-50 bg-white shadow-md"
					onclick={(e) => {
						e.stopPropagation();
						handleImageClick();
					}}
					disabled={uploadingImage}
					tabindex="-1"
				>
					{#if uploadingImage}
						<div
							class="border-t-color-primary h-4 w-4 animate-spin rounded-full border-2 border-gray-300"
						></div>
					{:else}
						<img src={iconCamera} alt="사진 추가" class="h-4 w-4" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Form -->
		<div class="flex flex-col gap-6">
			<!-- Nickname -->
			<div class="flex flex-col gap-2">
				<label for="nickname" class="text-primary text-[11px] leading-4 font-medium">닉네임</label>
				<div class="relative w-full">
					<input
						id="nickname"
						type="text"
						class="text-primary focus:border-color-primary h-12 w-full rounded-[9px] border border-gray-50 bg-gray-50 px-5 pr-10 text-[13px] leading-5 font-normal transition-all duration-200 outline-none placeholder:text-gray-400 focus:bg-blue-50/40 {formData.nickname
							? 'border-color-primary'
							: ''}"
						placeholder="메치트립"
						bind:value={formData.nickname}
						maxlength="20"
					/>
					{#if formData.nickname}
						<button
							type="button"
							class="absolute top-1/2 right-4 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-transparent p-0 opacity-100 transition-opacity duration-200"
							onclick={() => (formData.nickname = '')}
							aria-label="닉네임 지우기"
						>
							<img src={iconXCircle} alt="" class="h-full w-full" />
						</button>
					{/if}
				</div>
			</div>

			<!-- Frequent Area -->
			<div class="flex flex-col gap-2">
				<label for="frequentArea" class="text-primary text-[11px] leading-4 font-medium"
					>자주 가는 지역</label
				>
				<div class="relative w-full">
					<input
						id="frequentArea"
						type="text"
						class="text-primary focus:border-color-primary h-12 w-full rounded-[9px] border border-gray-50 bg-gray-50 px-5 text-[13px] leading-5 font-normal transition-all duration-200 outline-none placeholder:text-gray-400 focus:bg-blue-50/40 {formData.frequentArea
							? 'border-color-primary'
							: ''}"
						placeholder="베를린, 독일"
						bind:value={formData.frequentArea}
					/>
				</div>
			</div>

			<!-- Bio/Introduction -->
			<div class="flex flex-col gap-2">
				<label for="bio" class="text-primary text-[11px] leading-4 font-medium">자기소개</label>
				<div class="relative w-full">
					<textarea
						id="bio"
						class="text-primary focus:border-color-primary min-h-24 w-full rounded-[9px] border border-gray-50 bg-gray-50 px-5 py-3 text-[13px] leading-5 font-normal transition-all duration-200 outline-none placeholder:text-gray-400 focus:bg-blue-50/40 resize-none {formData.bio
							? 'border-color-primary'
							: ''}"
						placeholder="여행자들에게 자신을 소개해주세요. 자신의 경험, 전문 분야, 가이드 스타일 등을 자유롭게 작성해주세요."
						bind:value={formData.bio}
						maxlength="500"
					></textarea>
					<div class="mt-1 text-right text-[11px] text-gray-400">
						{formData.bio.length}/500
					</div>
				</div>
			</div>

			<!-- Email -->
			<div class="flex flex-col gap-2">
				<label for="email" class="text-primary text-[11px] leading-4 font-medium">이메일</label>
				<div class="relative w-full">
					<input
						id="email"
						type="email"
						class="text-primary h-12 w-full cursor-not-allowed rounded-[9px] border border-gray-50 bg-gray-100 px-5 text-[13px] leading-5 font-normal outline-none"
						placeholder="이메일을 입력해 주세요"
						value={formData.email}
						readonly
						disabled
					/>
				</div>
			</div>

			<!-- Birth Date -->
			<div class="flex flex-col gap-2">
				<label for="birthdate" class="text-primary text-[11px] leading-4 font-medium"
					>생년월일 <span class="text-secondary font-normal">(만 14세 이상)</span></label
				>
				<div class="relative w-full">
					<input
						id="birthdate"
						type="text"
						class="text-primary focus:border-color-primary h-12 w-full cursor-pointer rounded-[9px] border border-gray-50 bg-gray-50 px-5 pr-10 text-[13px] leading-5 font-normal transition-all duration-200 outline-none placeholder:text-gray-400 focus:bg-blue-50/40 {formData.birthDate
							? 'border-color-primary'
							: ''}"
						placeholder="생년월일을 선택해 주세요"
						value={formData.birthDate ? formatBirthDate(formData.birthDate) : ''}
						readonly
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							dateDialogOpen = true;
						}}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								dateDialogOpen = true;
							}
						}}
					/>
					<button
						type="button"
						class="absolute top-1/2 right-4 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-transparent p-0"
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							dateDialogOpen = true;
						}}
						aria-label="날짜 선택"
					>
						<Calendar size={16} class="text-secondary" />
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Section -->
	<div
		class="fixed right-0 bottom-0 left-0 border-t border-gray-200 bg-white"
		style="z-index: 40; box-shadow: 0px -5px 20px rgba(0, 0, 0, 0.05); display: block; visibility: visible;"
	>
		<div class="mx-auto max-w-[430px]">
			<div class="p-4">
				<button
					class="w-full cursor-pointer font-semibold text-white transition-colors duration-200"
					style="height: 48px; border-radius: 9px; font-size: 14px; line-height: 20px; background-color: {canProceed &&
					!isLoading
						? '#1095f4'
						: '#8ea0ac'}; {canProceed && !isLoading ? '' : 'cursor: not-allowed; opacity: 0.7;'}"
					disabled={!canProceed || isLoading}
					onclick={handleNext}
				>
					{isLoading ? '처리중...' : '다 음'}
				</button>
			</div>
		</div>
	</div>

	<!-- Date Picker Dialog -->
	<DatePickerDialog
		bind:open={dateDialogOpen}
		bind:value={dateValue}
		bind:placeholder={calendarPlaceholder}
		yearRange={maxYear - minYear + 1}
		onSelect={(date) => {
			if (date) {
				// Update form data immediately when date is selected
				formData.birthDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
				// Update the dateValue state as well
				dateValue = date;
				// Ensure dialog is closed
				dateDialogOpen = false;
			}
		}}
	/>
</div>

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

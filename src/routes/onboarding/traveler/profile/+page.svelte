<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import { CalendarDate, CalendarDateTime, ZonedDateTime, now, getLocalTimeZone, parseDate, today } from '@internationalized/date';
	import { Calendar } from 'lucide-svelte';
	import DatePickerDialog from '$lib/components/DatePickerDialog.svelte';
	import iconArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';
	import iconUser from '$lib/icons/icon-user-mono.svg';
	import iconCamera from '$lib/icons/icon-camera-mono.svg';
	import iconXCircle from '$lib/icons/icon-x-circle-mono.svg';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Get initial data from store
	let storeData = onboardingStore.get();
	
	// Loading state to prevent flash of content
	let isInitialized = $state(false);
	
	// Form data - initialize with store data if available
	let formData = $state({
		nickname: storeData.nickname || '',
		email: data.user?.email || storeData.email || '',
		birthDate: storeData.birthDate || ''
	});

	// Also restore profile image if it exists
	let profileImageUrl = $state(storeData.profileImageUrl || '');
	
	// Check required data immediately and redirect if missing
	if (!storeData.name || !storeData.phone) {
		// Redirect immediately without showing any content
		goto('/onboarding/traveler');
	} else {
		isInitialized = true;
	}
	
	onMount(() => {
		// Initialize dateValue if birthDate exists
		if (formData.birthDate) {
			const parts = formData.birthDate.split('-');
			if (parts.length === 3) {
				dateValue = new CalendarDate(
					parseInt(parts[0]), 
					parseInt(parts[1]), 
					parseInt(parts[2])
				);
				// Update calendar placeholder to show the correct month/year
				calendarPlaceholder = dateValue;
			}
		}
		
		
		// Clean up save timer on unmount
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});
	let uploadingImage = $state(false);

	let isLoading = $state(false);
	let dateValue = $state<CalendarDate | undefined>(undefined);
	let dateDialogOpen = $state(false);
	
	// Calculate the maximum year (user must be at least 14 years old)
	const currentYear = new Date().getFullYear();
	const maxYear = currentYear - 14;
	const minYear = currentYear - 100;
	
	// Set placeholder to a valid date for 14+ year olds
	let calendarPlaceholder = $state<CalendarDate>(new CalendarDate(maxYear, 1, 1));
	
	// Auto-save timer
	let saveTimer: number | null = null;
	
	// Auto-save function with debounce
	function autoSave() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			onboardingStore.setData({
				nickname: formData.nickname,
				email: formData.email,
				birthDate: formData.birthDate,
				profileImageUrl: profileImageUrl
			});
		}, 500); // Save after 500ms of no typing
	}
	
	// Watch for form changes and auto-save
	$effect(() => {
		// Trigger auto-save when form data changes
		formData.nickname;
		formData.email;
		formData.birthDate;
		profileImageUrl;
		autoSave();
	});

	// Validation
	function isValidEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function canProceed(): boolean {
		return (
			formData.nickname.trim().length >= 2 &&
			isValidEmail(formData.email) &&
			formData.birthDate.length > 0
		);
	}

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
					formData.append('type', 'traveler-profile');

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
		if (!canProceed()) return;

		isLoading = true;

		try {
			// First, set the user role to traveler
			const roleResponse = await fetch('/api/user/role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'traveler' })
			});

			if (!roleResponse.ok) {
				console.error('Failed to set user role');
			}

			// Update user profile data
			const profileResponse = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: storeData.name,
					phone: storeData.phone,
					birthDate: formData.birthDate
				})
			});

			if (!profileResponse.ok) {
				const error = await profileResponse.json();
				alert(error.error || '프로필 저장에 실패했습니다.');
				return;
			}

			// Create traveler profile
			const travelerResponse = await fetch('/api/profile/traveler', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: storeData.phone,
					// Add any other traveler-specific fields here if needed
				})
			});

			if (!travelerResponse.ok) {
				const error = await travelerResponse.json();
				alert(error.error || '여행자 프로필 생성에 실패했습니다.');
				return;
			}

			// Update user profile image if uploaded
			if (profileImageUrl) {
				// The image is already uploaded via /api/upload
				// We might need to update it in the user record
			}

			// Mark onboarding as completed
			const completeResponse = await fetch('/api/user/complete-onboarding', {
				method: 'POST'
			});

			if (!completeResponse.ok) {
				console.error('Failed to mark onboarding as complete');
			}

			// Invalidate all cached data to ensure session is refreshed
			await invalidateAll();

			// Clear auto-save timer
			if (saveTimer) clearTimeout(saveTimer);
			
			// Clear store and redirect to completion page
			onboardingStore.reset();
			
			// Now navigate with fresh session data
			await goto('/onboarding/traveler/complete');
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// Handle back
	function handleBack() {
		goto('/onboarding/traveler');
	}

	// Handle date selection from picker
	function handleDateSelect(date: CalendarDate) {
		dateValue = date;
		// Convert CalendarDate to string format YYYY-MM-DD
		formData.birthDate = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
	}

	// Format date for display
	function formatBirthDate(dateString: string): string {
		if (!dateString) return '';
		const date = new Date(dateString);
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${year}년 ${month}월 ${day}일`;
	}
</script>

<style>
	/* Spinner Animation */
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>

{#if !isInitialized}
	<!-- Loading state while checking data -->
	<div class="min-h-screen bg-white relative overflow-hidden">
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div class="w-8 h-8 border-[3px] border-gray-200 border-t-color-primary rounded-full animate-spin mx-auto mb-4"></div>
				<p class="text-sm text-gray-500">잠시만 기다려주세요...</p>
			</div>
		</div>
	</div>
{:else}
<div class="min-h-screen bg-white relative overflow-hidden">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white/92 backdrop-blur-[10px] h-14 border-b-2 border-[rgba(0,62,129,0.08)]">
		<div class="flex items-center justify-between h-full px-4 relative">
			<button class="w-6 h-6 cursor-pointer bg-none border-none p-0 flex items-center justify-center" onclick={handleBack}>
				<img src={iconArrowBack} alt="뒤로가기" />
			</button>
			<!-- Progress Bar -->
			<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(0,62,129,0.08)]">
				<div class="absolute bottom-0 left-0 w-1/2 h-0.5 bg-color-primary transition-[width] duration-300 ease-in-out"></div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="px-4 py-6 pb-[120px]">
		<!-- Title -->
		<div class="mb-10">
			<h1 class="font-bold text-[22px] leading-8 text-primary mb-2">기본 정보</h1>
			<p class="font-normal text-[13px] leading-5 text-[#8ea0ac]">사용자를 파악할 수 있는 정보를 알려주세요</p>
		</div>

		<!-- Profile Image -->
		<div class="flex justify-center mb-10">
			<div 
				class="relative w-[124px] h-[124px] cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]" 
				onclick={handleImageClick} 
				role="button" 
				tabindex="0" 
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						handleImageClick();
					}
				}}
			>
				<div class="w-[124px] h-[124px] rounded-[62px] bg-[rgba(0,62,129,0.08)] flex items-center justify-center overflow-hidden transition-colors duration-200 hover:bg-[rgba(0,62,129,0.12)]">
					{#if profileImageUrl}
						<img src={profileImageUrl} alt="프로필 이미지" class="w-full h-full object-cover" />
					{:else}
						<img src={iconUser} alt="프로필 이미지" class="w-[68px] h-[68px]" />
					{/if}
				</div>
				<button 
					class="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border border-[rgba(0,62,129,0.01)] flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.08)]" 
					onclick={(e) => {
						e.stopPropagation();
						handleImageClick();
					}} 
					disabled={uploadingImage} 
					tabindex="-1"
				>
					{#if uploadingImage}
						<div class="w-4 h-4 border-2 border-gray-200 border-t-color-primary rounded-full animate-spin"></div>
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
						class="w-full h-12 bg-[rgba(0,62,129,0.02)] border border-[rgba(0,62,129,0.01)] rounded-[9px] px-5 pr-10 font-normal text-[13px] leading-5 text-primary outline-none transition-all duration-200 placeholder:text-[#919fa8] focus:border-color-primary focus:bg-[rgba(16,149,244,0.04)] {formData.nickname ? 'border-color-primary' : ''}"
						placeholder="닉네임을 입력해 주세요"
						bind:value={formData.nickname}
						maxlength="20"
					/>
					{#if formData.nickname}
						<button
							type="button"
							class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer bg-none border-none p-0 flex items-center justify-center opacity-100 transition-opacity duration-200"
							onclick={() => formData.nickname = ''}
							aria-label="닉네임 지우기"
						>
							<img src={iconXCircle} alt="" class="w-full h-full" />
						</button>
					{/if}
				</div>
			</div>

			<!-- Email -->
			<div class="flex flex-col gap-2">
				<label for="email" class="font-medium text-[11px] leading-4 text-primary">이메일</label>
				<div class="relative w-full">
					<input
						id="email"
						type="email"
						class="w-full h-12 bg-gray-100 border border-[rgba(0,62,129,0.01)] rounded-[9px] px-5 pr-10 font-normal text-[13px] leading-5 text-primary outline-none cursor-not-allowed border-color-primary"
						placeholder="이메일을 입력해 주세요"
						value={formData.email}
						readonly
						disabled
					/>
				</div>
			</div>

			<!-- Birth Date -->
			<div class="flex flex-col gap-2">
				<label for="birthdate" class="font-medium text-[11px] leading-4 text-primary">생년월일 <span class="font-normal text-secondary">(만 14세 이상)</span></label>
				<div class="relative w-full">
					<input
						id="birthdate"
						type="text"
						class="w-full h-12 bg-[rgba(0,62,129,0.02)] border border-[rgba(0,62,129,0.01)] rounded-[9px] px-5 pr-10 font-normal text-[13px] leading-5 text-primary outline-none transition-all duration-200 placeholder:text-[#919fa8] cursor-pointer {formData.birthDate ? 'border-color-primary' : ''}"
						placeholder="생년월일을 선택해 주세요"
						value={formData.birthDate ? formatBirthDate(formData.birthDate) : ''}
						readonly
						onclick={() => dateDialogOpen = true}
					/>
					<button
						type="button"
						class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer bg-none border-none p-0 flex items-center justify-center"
						onclick={() => dateDialogOpen = true}
						aria-label="날짜 선택"
					>
						<Calendar size={16} class="text-[#8ea0ac]" />
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0px_-5px_20px_rgba(0,0,0,0.05)] z-40">
		<div class="p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
			<button 
				class="w-full h-12 border-none rounded-[9px] font-semibold text-sm leading-5 text-white cursor-pointer transition-colors duration-200 disabled:cursor-not-allowed"
				style="background-color: {canProceed() && !isLoading ? '#1095f4' : '#8ea0ac'}" 
				disabled={!canProceed() || isLoading}
				onclick={handleNext}
			>
				{isLoading ? '처리중...' : '다 음'}
			</button>
		</div>
	</div>

	<!-- Date Picker Dialog -->
	<DatePickerDialog 
		bind:open={dateDialogOpen}
		bind:value={dateValue}
		bind:placeholder={calendarPlaceholder}
		yearRange={maxYear - minYear + 1}
		onSelect={handleDateSelect}
	/>

</div>
{/if}
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
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

	onMount(() => {
		// Check required data and redirect if missing
		if (!storeData.name || !storeData.phone) {
			goto('/onboarding/traveler');
			return;
		}
		
		// Set initialized after client-side check
		isInitialized = true;
		
		// Initialize dateValue if birthDate exists
		if (formData.birthDate) {
			const parts = formData.birthDate.split('-');
			if (parts.length === 3) {
				dateValue = new CalendarDate(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
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
					birthDate: formData.birthDate,
					image: profileImageUrl || null
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
					profileImageUrl: profileImageUrl || null
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

{#if !isInitialized}
	<!-- Loading state while checking data -->
	<div class="relative min-h-screen overflow-hidden bg-white">
		<div class="flex min-h-screen items-center justify-center">
			<div class="text-center">
				<div
					class="border-t-color-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-[3px] border-gray-200"
				></div>
				<p class="text-sm text-gray-500">잠시만 기다려주세요...</p>
			</div>
		</div>
	</div>
{:else}
	<div class="relative min-h-screen overflow-hidden bg-white">
		<!-- Header -->
		<header
			class="sticky top-0 z-10 h-14 border-b-2 border-[rgba(0,62,129,0.08)] bg-white/92 backdrop-blur-[10px]"
		>
			<div class="relative flex h-full items-center justify-between px-4">
				<button
					class="flex h-6 w-6 cursor-pointer items-center justify-center border-none bg-none p-0"
					onclick={handleBack}
				>
					<img src={iconArrowBack} alt="뒤로가기" />
				</button>
				<!-- Progress Bar -->
				<div class="absolute right-0 bottom-0 left-0 h-0.5 bg-[rgba(0,62,129,0.08)]">
					<div
						class="bg-color-primary absolute bottom-0 left-0 h-0.5 w-1/2 transition-[width] duration-300 ease-in-out"
					></div>
				</div>
			</div>
		</header>

		<!-- Content -->
		<div class="px-4 py-6 pb-32">
			<!-- Title -->
			<div class="mb-10">
				<h1 class="text-primary mb-2 text-[22px] leading-8 font-bold">기본 정보</h1>
				<p class="text-[13px] leading-5 font-normal text-[#8ea0ac]">
					사용자를 파악할 수 있는 정보를 알려주세요
				</p>
			</div>

			<!-- Profile Image -->
			<div class="mb-10 flex justify-center">
				<div
					class="relative h-[124px] w-[124px] transition-transform duration-200 {!uploadingImage
						? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
						: 'cursor-not-allowed'}"
					onclick={() => !uploadingImage && handleImageClick()}
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
						class="relative flex h-[124px] w-[124px] items-center justify-center overflow-hidden rounded-[62px] bg-[rgba(0,62,129,0.08)] transition-colors duration-200 hover:bg-[rgba(0,62,129,0.12)]"
					>
						{#if profileImageUrl}
							<img src={profileImageUrl} alt="프로필 이미지" class="h-full w-full object-cover" />
						{:else}
							<img src={iconUser} alt="프로필 이미지" class="h-[68px] w-[68px]" />
						{/if}
						{#if uploadingImage}
							<div
								class="absolute inset-0 flex items-center justify-center rounded-[62px] bg-black/50"
							>
								<div
									class="h-8 w-8 animate-spin rounded-full border-[3px] border-white/30 border-t-white"
								></div>
							</div>
						{/if}
					</div>
					<button
						class="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[rgba(0,62,129,0.01)] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
						onclick={(e) => {
							e.stopPropagation();
							handleImageClick();
						}}
						disabled={uploadingImage}
						tabindex="-1"
					>
						{#if uploadingImage}
							<div
								class="border-t-color-primary h-4 w-4 animate-spin rounded-full border-2 border-gray-200"
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
					<label for="nickname" class="text-primary text-[11px] leading-4 font-medium">닉네임</label
					>
					<div class="relative w-full">
						<input
							id="nickname"
							type="text"
							class="text-primary focus:border-color-primary h-12 w-full rounded-[9px] border border-[rgba(0,62,129,0.01)] bg-[rgba(0,62,129,0.02)] px-5 pr-10 text-[13px] leading-5 font-normal transition-all duration-200 outline-none placeholder:text-[#919fa8] focus:bg-[rgba(16,149,244,0.04)] {formData.nickname
								? 'border-color-primary'
								: ''}"
							placeholder="닉네임을 입력해 주세요"
							bind:value={formData.nickname}
							maxlength="20"
						/>
						{#if formData.nickname}
							<button
								type="button"
								class="absolute top-1/2 right-4 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-none p-0 opacity-100 transition-opacity duration-200"
								onclick={() => (formData.nickname = '')}
								aria-label="닉네임 지우기"
							>
								<img src={iconXCircle} alt="" class="h-full w-full" />
							</button>
						{/if}
					</div>
				</div>

				<!-- Email -->
				<div class="flex flex-col gap-2">
					<label for="email" class="text-primary text-[11px] leading-4 font-medium">이메일</label>
					<div class="relative w-full">
						<input
							id="email"
							type="email"
							class="text-primary border-color-primary h-12 w-full cursor-not-allowed rounded-[9px] border border-[rgba(0,62,129,0.01)] bg-gray-100 px-5 pr-10 text-[13px] leading-5 font-normal outline-none"
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
							class="text-primary h-12 w-full cursor-pointer rounded-[9px] border border-[rgba(0,62,129,0.01)] bg-[rgba(0,62,129,0.02)] px-5 pr-10 text-[13px] leading-5 font-normal transition-all duration-200 outline-none placeholder:text-[#919fa8] {formData.birthDate
								? 'border-color-primary'
								: ''}"
							placeholder="생년월일을 선택해 주세요"
							value={formData.birthDate ? formatBirthDate(formData.birthDate) : ''}
							readonly
							onclick={() => (dateDialogOpen = true)}
						/>
						<button
							type="button"
							class="absolute top-1/2 right-4 flex h-4 w-4 -translate-y-1/2 cursor-pointer items-center justify-center border-none bg-none p-0"
							onclick={() => (dateDialogOpen = true)}
							aria-label="날짜 선택"
						>
							<Calendar size={16} class="text-[#8ea0ac]" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Bottom Section -->
		<div
			class="fixed right-0 bottom-0 left-0 z-40 border-t border-gray-200 bg-white shadow-[0px_-5px_20px_rgba(0,0,0,0.05)]"
		>
			<div class="mx-auto max-w-[430px] p-4">
				<button
					class="h-12 w-full cursor-pointer rounded-[9px] border-none text-sm leading-5 font-semibold text-white transition-colors duration-200 disabled:cursor-not-allowed"
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

<style>
	/* Spinner Animation */
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	.animate-spin {
		animation: spin 1s linear infinite;
	}
</style>

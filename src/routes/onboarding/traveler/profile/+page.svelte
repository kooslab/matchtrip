<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
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

	// Get initial data from store
	let storeData = onboardingStore.get();
	
	// Form data - initialize with store data if available
	let formData = $state({
		nickname: storeData.nickname || '',
		email: data.user?.email || storeData.email || '',
		birthDate: storeData.birthDate || ''
	});

	// Also restore profile image if it exists
	let profileImageUrl = $state(storeData.profileImageUrl || '');
	
	onMount(() => {
		// Check if required data exists
		if (!storeData.name || !storeData.phone) {
			goto('/onboarding/traveler');
			return;
		}
		
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
		
		// Update traveler profile completion percentage if birth date exists
		if (formData.birthDate) {
			travelerProfileComplete = 100;
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
	let calendarPlaceholder = $state<CalendarDate>(today(getLocalTimeZone()));
	
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

	// Handle date change
	$effect(() => {
		if (dateValue) {
			// Convert CalendarDate to string format YYYY-MM-DD
			formData.birthDate = `${dateValue.year}-${String(dateValue.month).padStart(2, '0')}-${String(dateValue.day).padStart(2, '0')}`;
			// Close dialog when date is selected
			dateDialogOpen = false;
		}
	});

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
</script>

<style>
	.container {
		min-height: 100vh;
		background-color: #ffffff;
		position: relative;
		overflow: hidden;
	}

	.header {
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: rgba(255, 255, 255, 0.92);
		backdrop-filter: blur(10px);
		height: 56px;
		border-bottom: 2px solid rgba(0, 62, 129, 0.08);
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100%;
		padding: 0 16px;
		position: relative;
	}

	.back-button {
		width: 24px;
		height: 24px;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-bar {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 2px;
		background-color: rgba(0, 62, 129, 0.08);
	}

	.progress-fill {
		position: absolute;
		bottom: 0;
		left: 0;
		width: 50%;
		height: 2px;
		background-color: #1095f4;
		transition: width 0.3s ease;
	}

	.content {
		padding: 24px 16px 120px;
	}

	.title-section {
		margin-bottom: 40px;
	}

	.title {
		font-family: 'Pretendard', sans-serif;
		font-weight: 700;
		font-size: 22px;
		line-height: 32px;
		color: #052236;
		margin-bottom: 8px;
	}

	.subtitle {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 20px;
		color: #8ea0ac;
	}

	.profile-image-section {
		display: flex;
		justify-content: center;
		margin-bottom: 40px;
	}

	.profile-image-container {
		position: relative;
		width: 124px;
		height: 124px;
		cursor: pointer;
		transition: transform 0.2s ease;
	}

	.profile-image-container:hover {
		transform: scale(1.02);
	}

	.profile-image-container:active {
		transform: scale(0.98);
	}

	.profile-image-circle {
		width: 124px;
		height: 124px;
		border-radius: 62px;
		background-color: rgba(0, 62, 129, 0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		transition: background-color 0.2s ease;
	}

	.profile-image-container:hover .profile-image-circle {
		background-color: rgba(0, 62, 129, 0.12);
	}

	.profile-image-circle img {
		width: 68px;
		height: 68px;
	}

	.profile-image-circle .uploaded-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.camera-button {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 32px;
		height: 32px;
		background-color: #ffffff;
		border-radius: 16px;
		border: 1px solid rgba(0, 62, 129, 0.01);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.camera-button img {
		width: 16px;
		height: 16px;
	}

	.form-section {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.label {
		font-family: 'Pretendard', sans-serif;
		font-weight: 500;
		font-size: 11px;
		line-height: 16px;
		color: #052236;
	}

	.input-container {
		position: relative;
		width: 100%;
	}

	.input-field {
		width: 100%;
		height: 48px;
		background-color: rgba(0, 62, 129, 0.02);
		border: 1px solid rgba(0, 62, 129, 0.01);
		border-radius: 9px;
		padding: 14px 40px 14px 20px;
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 20px;
		color: #052236;
		outline: none;
		transition: all 0.2s ease;
	}

	.input-field:focus {
		border-color: #1095f4;
		background-color: rgba(16, 149, 244, 0.04);
	}

	.input-field::placeholder {
		color: #919fa8;
	}

	.input-field.has-value {
		border-color: #1095f4;
	}

	.input-icon {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		width: 16px;
		height: 16px;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.input-icon img {
		width: 100%;
		height: 100%;
	}

	.input-icon svg {
		width: 16px;
		height: 16px;
		color: #8ea0ac;
	}

	.clear-icon {
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.input-field.has-value ~ .clear-icon {
		opacity: 1;
	}

	.bottom-section {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: rgba(254, 254, 254, 0.96);
		backdrop-filter: blur(10px);
		border-top: 1px solid #f1f1f1;
		box-shadow: 0px -5px 20px rgba(0, 0, 0, 0.02);
	}

	.bottom-content {
		padding: 8px 16px;
		padding-bottom: calc(8px + env(safe-area-inset-bottom));
	}

	.next-button {
		width: 100%;
		height: 48px;
		background-color: #8ea0ac;
		border: none;
		border-radius: 9px;
		font-family: 'Pretendard', sans-serif;
		font-weight: 600;
		font-size: 14px;
		line-height: 20px;
		color: #ffffff;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.next-button:enabled {
		background-color: #1095f4;
	}

	.next-button:disabled {
		cursor: not-allowed;
	}

	/* Dialog Styles */
	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.6);
		z-index: 50;
		animation: fadeIn 0.2s ease-out;
	}

	:global(.dialog-content) {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 50;
		width: calc(100vw - 32px);
		max-width: 540px;
		background-color: transparent;
		animation: slideUp 0.3s ease-out;
	}

	/* Date Picker Container */
	.date-picker-container {
		display: flex;
		background-color: #ffffff;
		border-radius: 16px;
		border: 1px solid rgba(0, 62, 129, 0.08);
		box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		height: 440px;
	}

	/* Year Selector Panel */
	.year-selector-panel {
		width: 120px;
		background-color: rgba(0, 62, 129, 0.02);
		border-right: 1px solid rgba(0, 62, 129, 0.08);
		display: flex;
		flex-direction: column;
	}

	.year-selector-header {
		padding: 16px;
		font-size: 13px;
		font-weight: 600;
		color: #052236;
		text-align: center;
		border-bottom: 1px solid rgba(0, 62, 129, 0.08);
		background-color: #ffffff;
	}

	.year-selector-list {
		flex: 1;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 8px 0;
	}

	.year-selector-item {
		width: 100%;
		padding: 10px 16px;
		text-align: center;
		font-size: 14px;
		font-weight: 400;
		color: #052236;
		background: none;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.year-selector-item:hover {
		background-color: rgba(16, 149, 244, 0.08);
		color: #1095f4;
	}

	.year-selector-item.selected {
		background-color: #1095f4;
		color: #ffffff;
		font-weight: 600;
	}

	/* Date Picker Calendar Split */
	:global(.date-picker-calendar-split) {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
	}

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
		color: #052236;
		transition: all 0.2s ease;
	}

	:global(.date-picker-nav-button:hover) {
		background-color: rgba(0, 62, 129, 0.04);
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
		color: #052236;
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


	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #f3f3f3;
		border-top: 2px solid #1095f4;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>

<div class="container">
	<!-- Header -->
	<header class="header">
		<div class="header-content">
			<button class="back-button" onclick={handleBack}>
				<img src={iconArrowBack} alt="뒤로가기" />
			</button>
			<div class="progress-bar">
				<div class="progress-fill"></div>
			</div>
		</div>
	</header>

	<!-- Content -->
	<div class="content">
		<!-- Title -->
		<div class="title-section">
			<h1 class="title">기본 정보</h1>
			<p class="subtitle">사용자를 파악할 수 있는 정보를 알려주세요</p>
		</div>

		<!-- Profile Image -->
		<div class="profile-image-section">
			<div class="profile-image-container" onclick={handleImageClick} role="button" tabindex="0" onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					handleImageClick();
				}
			}}>
				<div class="profile-image-circle">
					{#if profileImageUrl}
						<img src={profileImageUrl} alt="프로필 이미지" class="uploaded-image" />
					{:else}
						<img src={iconUser} alt="프로필 이미지" />
					{/if}
				</div>
				<button class="camera-button" onclick={(e) => {
					e.stopPropagation();
					handleImageClick();
				}} disabled={uploadingImage} tabindex="-1">
					{#if uploadingImage}
						<div class="spinner"></div>
					{:else}
						<img src={iconCamera} alt="사진 추가" />
					{/if}
				</button>
			</div>
		</div>

		<!-- Form -->
		<div class="form-section">
			<!-- Nickname -->
			<div class="form-group">
				<label for="nickname" class="label">닉네임</label>
				<div class="input-container">
					<input
						id="nickname"
						type="text"
						class="input-field {formData.nickname ? 'has-value' : ''}"
						placeholder="닉네임을 입력해 주세요"
						bind:value={formData.nickname}
						maxlength="20"
					/>
					{#if formData.nickname}
						<button
							type="button"
							class="input-icon clear-icon"
							onclick={() => formData.nickname = ''}
							aria-label="닉네임 지우기"
						>
							<img src={iconXCircle} alt="" />
						</button>
					{/if}
				</div>
			</div>

			<!-- Email -->
			<div class="form-group">
				<label for="email" class="label">이메일</label>
				<div class="input-container">
					<input
						id="email"
						type="email"
						class="input-field has-value"
						placeholder="이메일을 입력해 주세요"
						value={formData.email}
						readonly
						disabled
						style="background-color: #f5f5f5; cursor: not-allowed;"
					/>
				</div>
			</div>

			<!-- Birth Date -->
			<div class="form-group">
				<label for="birthdate" class="label">생년월일</label>
				<div class="input-container">
					<input
						id="birthdate"
						type="text"
						class="input-field {formData.birthDate ? 'has-value' : ''}"
						placeholder="생년월일을 선택해 주세요"
						value={formData.birthDate ? formatBirthDate(formData.birthDate) : ''}
						readonly
						onclick={() => dateDialogOpen = true}
					/>
					<button
						type="button"
						class="input-icon"
						onclick={() => dateDialogOpen = true}
						aria-label="날짜 선택"
					>
						<Calendar size={16} />
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="bottom-section">
		<div class="bottom-content">
			<button 
				class="next-button" 
				disabled={!canProceed() || isLoading}
				onclick={handleNext}
			>
				{isLoading ? '처리중...' : '다 음'}
			</button>
		</div>
	</div>

	<!-- Date Picker Dialog -->
	<Dialog.Root bind:open={dateDialogOpen}>
		<Dialog.Portal>
			<Dialog.Overlay class="dialog-overlay" />
			<Dialog.Content class="dialog-content">
				<div class="date-picker-container">
					<!-- Year selector (left side) -->
					<div class="year-selector-panel">
						<div class="year-selector-header">연도 선택</div>
						<div class="year-selector-list">
							{#each Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i) as year}
								<button
									type="button"
									class="year-selector-item {calendarPlaceholder.year === year ? 'selected' : ''}"
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
					<DatePicker.Root bind:value={dateValue} bind:placeholder={calendarPlaceholder} weekdayFormat="short" fixedWeeks={true}>
						<DatePicker.Calendar class="date-picker-calendar-split">
							{#snippet children({ months, weekdays })}
								<DatePicker.Header class="mb-4">
									<div class="flex items-center justify-between">
										<DatePicker.PrevButton class="date-picker-nav-button">
											<ChevronLeft class="w-5 h-5" />
										</DatePicker.PrevButton>
										<DatePicker.Heading class="text-[15px] font-semibold text-primary" />
										<DatePicker.NextButton class="date-picker-nav-button">
											<ChevronRight class="w-5 h-5" />
										</DatePicker.NextButton>
									</div>
								</DatePicker.Header>
								<div class="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
									{#each months as month (month.value)}
										<DatePicker.Grid class="w-full border-collapse select-none space-y-1">
											<DatePicker.GridHead>
												<DatePicker.GridRow class="mb-1 flex w-full justify-between">
													{#each weekdays as day (day)}
														<DatePicker.HeadCell class="text-secondary font-normal! w-9 rounded-md text-xs">
															<div>{day.slice(0, 2)}</div>
														</DatePicker.HeadCell>
													{/each}
												</DatePicker.GridRow>
											</DatePicker.GridHead>
											<DatePicker.GridBody>
												{#each month.weeks as weekDates (weekDates)}
													<DatePicker.GridRow class="flex w-full">
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
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { onboardingStore } from '$lib/stores/onboardingStore';
	import iconArrowBack from '$lib/icons/icon-arrow-back-android-mono.svg';

	// Get initial data from store
	let storeData = onboardingStore.get();

	onMount(() => {
		// Check if required data exists
		if (
			!storeData.name ||
			!storeData.phone ||
			!storeData.nickname ||
			!storeData.destinations?.length
		) {
			goto('/onboarding/guide');
		}
	});

	// Document categories
	const documentCategories = [
		{
			id: 'guide-license',
			title: '가이드 자격증',
			description: '지원되는 파일 형식: pdf, pptx, hwp, docx, jpg, png , gif'
		},
		{
			id: 'license-certification',
			title: '면허 운전면허증(자택 가이드)',
			description: '지원되는 파일 형식: pdf, pptx, hwp, docx, jpg, png , gif'
		},
		{
			id: 'insurance',
			title: '자동 보험',
			description: '지원되는 파일 형식: pdf, pptx, hwp, docx, jpg, png , gif'
		},
		{
			id: 'identity',
			title: '신분증 또는 여권',
			description: '지원되는 파일 형식: pdf, pptx, hwp, docx, jpg, png , gif'
		}
	];

	// Initialize uploaded files from store if they exist
	let uploadedFiles = $state<Record<string, File[]>>(storeData.uploadedFiles || {});
	let isLoading = $state(false);

	// Check if all required documents are uploaded
	function areAllDocumentsUploaded(): boolean {
		return documentCategories.every(
			(category) => uploadedFiles[category.id] && uploadedFiles[category.id].length > 0
		);
	}

	// Handle file upload for specific category
	function handleFileUpload(categoryId: string, event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files) {
			const currentFiles = uploadedFiles[categoryId] || [];
			uploadedFiles[categoryId] = [...currentFiles, ...Array.from(input.files)];
		}
	}

	function removeFile(categoryId: string, index: number) {
		if (uploadedFiles[categoryId]) {
			uploadedFiles[categoryId] = uploadedFiles[categoryId].filter((_, i) => i !== index);
		}
	}

	function triggerFileInput(categoryId: string) {
		const input = document.getElementById(`file-input-${categoryId}`) as HTMLInputElement;
		input?.click();
	}

	// Handle next (complete profile)
	async function handleNext() {
		isLoading = true;
		console.log('[GUIDE ONBOARDING] Starting profile completion');

		try {
			// Create FormData for file upload
			const profileData = new FormData();
			profileData.append('name', storeData.name);
			profileData.append('phone', storeData.phone);
			profileData.append('nickname', storeData.nickname);
			profileData.append('frequentArea', storeData.frequentArea);
			profileData.append('birthDate', storeData.birthDate);
			profileData.append('destinations', JSON.stringify(storeData.destinations));
			if (storeData.profileImageUrl) {
				profileData.append('profileImageUrl', storeData.profileImageUrl);
			}

			// Add certification files by category
			Object.entries(uploadedFiles).forEach(([categoryId, files]) => {
				files.forEach((file) => {
					profileData.append(`documents_${categoryId}`, file);
				});
			});

			// First, set the user role to guide
			console.log('[GUIDE ONBOARDING] Setting user role to guide');
			const roleResponse = await fetch('/api/user/role', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: 'guide' })
			});

			if (!roleResponse.ok) {
				console.error('[GUIDE ONBOARDING] Failed to set user role:', await roleResponse.text());
			} else {
				console.log('[GUIDE ONBOARDING] User role set to guide successfully');
			}

			// Update user profile data
			console.log('[GUIDE ONBOARDING] Updating user profile');
			const userResponse = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: storeData.name,
					phone: storeData.phone,
					birthDate: storeData.birthDate
				})
			});

			if (!userResponse.ok) {
				const error = await userResponse.json();
				console.error('[GUIDE ONBOARDING] Failed to update user profile:', error);
				alert(error.error || '프로필 저장에 실패했습니다.');
				return;
			}
			console.log('[GUIDE ONBOARDING] User profile updated successfully');

			// Create guide profile
			console.log('[GUIDE ONBOARDING] Creating guide profile');
			const guideResponse = await fetch('/api/profile/guide', {
				method: 'POST',
				body: profileData
			});

			if (guideResponse.ok) {
				console.log('[GUIDE ONBOARDING] Guide profile created successfully');
				
				// Mark onboarding as completed
				console.log('[GUIDE ONBOARDING] Marking onboarding as completed');
				const completeResponse = await fetch('/api/user/complete-onboarding', {
					method: 'POST'
				});

				if (!completeResponse.ok) {
					console.error('[GUIDE ONBOARDING] Failed to mark onboarding as complete:', await completeResponse.text());
					// Don't return here - try to proceed anyway
				} else {
					const result = await completeResponse.json();
					console.log('[GUIDE ONBOARDING] Onboarding marked as completed:', result);
				}

				// Invalidate all cached data to ensure session is refreshed
				console.log('[GUIDE ONBOARDING] Invalidating all cached data');
				await invalidateAll();

				// Clear store
				console.log('[GUIDE ONBOARDING] Clearing store');
				onboardingStore.reset();

				// Small delay to ensure database updates are propagated
				console.log('[GUIDE ONBOARDING] Waiting for database propagation');
				await new Promise(resolve => setTimeout(resolve, 500));

				// Use hard navigation to ensure fresh session data
				console.log('[GUIDE ONBOARDING] Navigating to completion page with hard refresh');
				window.location.href = '/onboarding/guide/complete';
			} else {
				const error = await guideResponse.json();
				console.error('[GUIDE ONBOARDING] Failed to create guide profile:', error);
				alert(error.error || '가이드 프로필 생성에 실패했습니다.');
			}
		} catch (error) {
			console.error('Error:', error);
			alert('오류가 발생했습니다.');
		} finally {
			isLoading = false;
		}
	}

	// Handle skip
	async function handleSkip() {
		console.log('[GUIDE ONBOARDING] Skip button clicked - proceeding without documents');
		await handleNext();
	}

	// Handle back
	function handleBack() {
		// Save current uploaded files to store before going back
		onboardingStore.setData({
			uploadedFiles: uploadedFiles
		});

		goto('/onboarding/guide/destinations');
	}

	// Handle Enter key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (!isLoading) {
				handleNext();
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

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
			<h1 class="title">자격 서류</h1>
			<p class="subtitle">가이드 승인을 위한 서류를 업로드해주세요</p>
		</div>

		<!-- Document Categories -->
		<div class="documents-section">
			{#each documentCategories as category}
				<div class="document-category">
					<div class="category-title">{category.title}</div>

					<!-- Hidden file input -->
					<input
						id="file-input-{category.id}"
						type="file"
						multiple
						accept=".pdf,.pptx,.hwp,.docx,.jpg,.jpeg,.png,.gif"
						onchange={(e) => handleFileUpload(category.id, e)}
						class="hidden-input"
					/>

					<!-- Upload area -->
					<div class="upload-area" onclick={() => triggerFileInput(category.id)}>
						<svg class="upload-icon" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
							/>
						</svg>
						<div class="upload-text">파일을 클릭하여 찾아보세요.</div>
					</div>

					<!-- File format info -->
					<div class="file-format-text">{category.description}</div>

					<!-- Uploaded files for this category -->
					{#if uploadedFiles[category.id]?.length > 0}
						<div class="uploaded-files">
							{#each uploadedFiles[category.id] as file, index}
								<div class="file-item">
									<div class="file-info">
										<svg class="file-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
											/>
										</svg>
										<div class="file-name">{file.name}</div>
									</div>
									<button
										class="remove-button"
										onclick={() => removeFile(category.id, index)}
										aria-label="파일 삭제"
									>
										<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	<!-- Bottom Section -->
	<div class="bottom-section">
		<div class="bottom-content">
			<div class="buttons-row">
				<button class="skip-button" onclick={handleSkip} disabled={isLoading}> 건너뛰기 </button>
				<button
					class="next-button"
					disabled={!areAllDocumentsUploaded() || isLoading}
					onclick={handleNext}
				>
					{isLoading ? '처리중...' : '완료'}
				</button>
			</div>
		</div>
	</div>
</div>

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
		width: 100%;
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

	.documents-section {
		margin-bottom: 32px;
	}

	.document-category {
		margin-bottom: 32px;
	}

	.category-title {
		font-family: 'Pretendard', sans-serif;
		font-weight: 600;
		font-size: 15px;
		line-height: 24px;
		color: #052236;
		margin-bottom: 16px;
	}

	.upload-area {
		width: 100%;
		height: 120px;
		border: 2px dashed rgba(0, 62, 129, 0.16);
		border-radius: 9px;
		background-color: rgba(0, 62, 129, 0.02);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-bottom: 8px;
	}

	.upload-area:hover {
		border-color: #1095f4;
		background-color: rgba(16, 149, 244, 0.04);
	}

	.upload-icon {
		width: 40px;
		height: 40px;
		margin-bottom: 8px;
		color: #c8d2d8;
	}

	.upload-text {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 20px;
		color: #1095f4;
		margin-bottom: 4px;
	}

	.file-format-text {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 11px;
		line-height: 16px;
		color: #8ea0ac;
	}

	.uploaded-files {
		margin-top: 12px;
	}

	.file-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background-color: rgba(0, 62, 129, 0.02);
		border-radius: 9px;
		margin-bottom: 8px;
	}

	.file-info {
		display: flex;
		align-items: center;
		flex: 1;
	}

	.file-icon {
		width: 20px;
		height: 20px;
		margin-right: 12px;
		color: #8ea0ac;
	}

	.file-name {
		font-family: 'Pretendard', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 20px;
		color: #052236;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.remove-button {
		width: 20px;
		height: 20px;
		background: none;
		border: none;
		cursor: pointer;
		color: #8ea0ac;
		transition: color 0.2s ease;
	}

	.remove-button:hover {
		color: #f72b2b;
	}

	.hidden-input {
		display: none;
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

	.buttons-row {
		display: flex;
		gap: 12px;
	}

	.skip-button {
		flex: 1;
		height: 48px;
		background-color: #ffffff;
		border: 1px solid rgba(0, 62, 129, 0.08);
		border-radius: 9px;
		font-family: 'Pretendard', sans-serif;
		font-weight: 500;
		font-size: 14px;
		line-height: 20px;
		color: #8ea0ac;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.skip-button:hover {
		border-color: #1095f4;
		color: #1095f4;
	}

	.next-button {
		flex: 1;
		height: 48px;
		background-color: #1095f4;
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

	.next-button:disabled {
		background-color: #8ea0ac;
		cursor: not-allowed;
	}

	.hidden-input {
		display: none;
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { ChevronLeft, Camera, Plus, X } from 'lucide-svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	const { data, form } = $props();

	let isSubmitting = $state(false);
	let profileImageFile = $state<File | null>(null);
	let profileImagePreview = $state<string | null>(null);
	let uploadingImage = $state(false);

	// Form fields
	let name = $state(data.user?.name || '');
	let bio = $state(data.guideProfile?.bio || '');
	let languages = $state(data.guideProfile?.languages?.join(', ') || '');
	let specialties = $state(data.guideProfile?.specialties?.join(', ') || '');
	let experience = $state(data.guideProfile?.experience || '');

	// Phone number fields
	let countryCode = $state('+82'); // Default to Korea
	let mobile = $state('');
	let isDropdownOpen = $state(false);

	// Country codes for phone input
	const countryCodes = [
		{ code: '+82', flag: '🇰🇷', country: 'KR', name: '대한민국' },
		{ code: '+1', flag: '🇺🇸', country: 'US', name: '미국' },
		{ code: '+81', flag: '🇯🇵', country: 'JP', name: '일본' },
		{ code: '+86', flag: '🇨🇳', country: 'CN', name: '중국' },
		{ code: '+44', flag: '🇬🇧', country: 'GB', name: '영국' },
		{ code: '+33', flag: '🇫🇷', country: 'FR', name: '프랑스' },
		{ code: '+49', flag: '🇩🇪', country: 'DE', name: '독일' }
	];

	// Initialize phone from user data
	$effect(() => {
		if (data.user?.phone) {
			const phone = data.user.phone;
			// Find matching country code
			for (const country of countryCodes) {
				if (phone.startsWith(country.code.replace('+', ''))) {
					countryCode = country.code;
					mobile = phone.substring(country.code.length - 1); // Remove country code
					break;
				}
			}
			// If no country code matched, assume it's a local Korean number
			if (!mobile && phone) {
				if (phone.startsWith('010') || phone.startsWith('011')) {
					countryCode = '+82';
					mobile = phone;
				} else {
					// Fallback: show as is
					mobile = phone;
				}
			}
		}
	});

	// Get selected country object
	const selectedCountry = $derived(
		countryCodes.find((c) => c.code === countryCode) || countryCodes[0]
	);

	// Handle mobile input - only allow numbers
	function handleMobileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value;
		// Remove all non-numeric characters
		const numbersOnly = value.replace(/\D/g, '');
		// Limit to 15 digits max
		mobile = numbersOnly.slice(0, 15);
		// Update the input value to reflect the cleaned value
		input.value = mobile;
	}

	// Current profile image
	let currentProfileImage = $derived(() => {
		if (profileImagePreview) return profileImagePreview;
		if (data.guideProfile?.profileImageUrl) {
			const url = data.guideProfile.profileImageUrl;
			if (url.startsWith('http')) return url;
			return url.startsWith('/api/images/') ? url : `/api/images/${url}`;
		}
		return null;
	});

	function handleImageSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				alert('이미지 파일만 업로드 가능합니다.');
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('파일 크기는 5MB 이하여야 합니다.');
				return;
			}

			profileImageFile = file;

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				profileImagePreview = e.target?.result as string;
			};
			reader.readAsDataURL(file);
		}
	}

	async function uploadProfileImage() {
		if (!profileImageFile) return null;

		uploadingImage = true;

		try {
			const formData = new FormData();
			formData.append('file', profileImageFile);
			formData.append('type', 'guide-profile');

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				const data = await response.json();

				// Update guide profile with new image
				const updateResponse = await fetch('/api/profile/guide/update-image', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						profileImageUrl: data.filename
					})
				});

				if (updateResponse.ok) {
					return data.filename;
				}
			}

			throw new Error('Failed to upload image');
		} catch (error) {
			console.error('Error uploading image:', error);
			alert('프로필 이미지 업로드 중 오류가 발생했습니다.');
			return null;
		} finally {
			uploadingImage = false;
		}
	}

	// Remove handleSubmit function as we'll handle it directly in enhance
</script>

<div class="min-h-screen bg-gray-50 pb-8">
	<!-- Header -->
	<header class="sticky top-0 z-10 border-b border-gray-100 bg-white">
		<div class="flex h-14 items-center px-4">
			<button onclick={() => goto('/profile/guide')} class="-ml-2 p-2">
				<ChevronLeft class="h-5 w-5" />
			</button>
			<h1 class="ml-2 text-lg font-semibold">프로필 수정</h1>
		</div>
	</header>

	<!-- Profile Image Section -->
	<div class="bg-white p-6">
		<div class="flex flex-col items-center">
			<div class="relative">
				{#if currentProfileImage()}
					<img
						src={currentProfileImage()}
						alt="Profile"
						class="h-24 w-24 rounded-full object-cover"
					/>
				{:else}
					<div class="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
						<span class="text-2xl font-semibold text-gray-600">
							{data.user?.name?.charAt(0) || '?'}
						</span>
					</div>
				{/if}

				<label
					class="absolute right-0 bottom-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
				>
					<Camera class="h-4 w-4" />
					<input
						type="file"
						accept="image/*"
						class="hidden"
						onchange={handleImageSelect}
						disabled={uploadingImage}
					/>
				</label>
			</div>

			{#if uploadingImage}
				<p class="mt-2 text-sm text-gray-500">이미지 업로드 중...</p>
			{:else if profileImageFile}
				<p class="mt-2 text-sm text-green-600">새 이미지가 선택되었습니다</p>
			{/if}
		</div>
	</div>

	<!-- Form -->
	<form
		method="POST"
		action="?/updateProfile"
		onsubmit={(e) => {
			if (isSubmitting || uploadingImage) {
				e.preventDefault();
				return false;
			}
		}}
		use:enhance={() => {
			// Prevent double submission
			if (isSubmitting || uploadingImage) {
				return () => {};
			}

			isSubmitting = true;

			return async ({ update, result }) => {
				try {
					// Handle image upload first
					if (profileImageFile) {
						await uploadProfileImage();
					}

					// Update the form
					await update();

					// Check result and navigate on success
					if (result.type === 'success' || form?.success) {
						// Navigate to profile page on success
						// Don't reset isSubmitting to prevent button flickering
						goto('/profile/guide');
					} else if (result.type === 'failure') {
						// Only re-enable on failure
						isSubmitting = false;
					}
				} catch (error) {
					console.error('Form submission error:', error);
					isSubmitting = false;
				}
			};
		}}
		class="mt-2 space-y-2"
	>
		<!-- Basic Info -->
		<div class="bg-white p-4">
			<h2 class="mb-4 font-semibold text-gray-900">기본 정보</h2>

			<div class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-gray-700"> 이름 </label>
					<input
						type="text"
						id="name"
						name="name"
						bind:value={name}
						required
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<label for="phone" class="block text-sm font-medium text-gray-700"> 휴대폰 번호 </label>
					<div class="mt-1 flex gap-2">
						<!-- Country Code Selector -->
						<div class="relative">
							<button
								type="button"
								onclick={() => (isDropdownOpen = !isDropdownOpen)}
								class="flex h-[42px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium hover:bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								<span class="text-base">{selectedCountry.flag}</span>
								<span class="text-gray-900">{selectedCountry.code}</span>
								<svg
									class="h-4 w-4 text-gray-400 transition-transform {isDropdownOpen
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
							{#if isDropdownOpen}
								<div
									class="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
								>
									{#each countryCodes as country}
										<button
											type="button"
											onclick={() => {
												countryCode = country.code;
												isDropdownOpen = false;
											}}
											class="flex w-full cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-gray-50"
										>
											<span class="text-base">{country.flag}</span>
											<span class="font-medium text-gray-900">{country.code}</span>
										</button>
									{/each}
								</div>
							{/if}
						</div>
						<!-- Phone Number Input -->
						<input
							type="tel"
							id="phone"
							name="phone"
							inputmode="numeric"
							pattern="[0-9]*"
							value={mobile}
							maxlength="15"
							oninput={handleMobileInput}
							onkeydown={(e) => {
								// Allow special keys
								const allowedKeys = [
									'Backspace',
									'Delete',
									'Tab',
									'Escape',
									'Enter',
									'Home',
									'End',
									'ArrowLeft',
									'ArrowRight',
									'ArrowUp',
									'ArrowDown'
								];
								if (allowedKeys.includes(e.key)) return;
								// Allow Ctrl/Cmd combinations
								if (e.ctrlKey || e.metaKey) return;
								// Block if not a number
								if (!/^[0-9]$/.test(e.key)) {
									e.preventDefault();
								}
							}}
							placeholder={countryCode === '+82' ? '01012345678' : '1234567890'}
							class="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						휴대폰 번호는 숫자만 입력해주세요 (7-15자리)
					</p>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700"> 자기소개 </label>
					<RichTextEditor
						value={bio}
						onchange={(newContent) => (bio = newContent)}
						placeholder="여행자들에게 자신을 소개해주세요. 자신의 경험, 전문 분야, 가이드 스타일 등을 자유롭게 작성해주세요."
						minHeight="200px"
						showImageButton={true}
						showHelperText={true}
					/>
					<input type="hidden" name="bio" value={bio} />
				</div>

				<!-- Hidden input for full phone number with country code -->
				<input type="hidden" name="phone" value={countryCode.replace('+', '') + mobile} />
			</div>
		</div>

		<!-- Professional Info -->
		<div class="bg-white p-4">
			<h2 class="mb-4 font-semibold text-gray-900">전문 정보</h2>

			<div class="space-y-4">
				<div>
					<label for="languages" class="block text-sm font-medium text-gray-700">
						구사 가능 언어
					</label>
					<input
						type="text"
						id="languages"
						name="languages"
						bind:value={languages}
						placeholder="한국어, 영어, 일본어 (쉼표로 구분)"
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					/>
					<p class="mt-1 text-xs text-gray-500">쉼표로 구분하여 입력해주세요</p>
				</div>

				<div>
					<label for="specialties" class="block text-sm font-medium text-gray-700">
						전문 분야
					</label>
					<input
						type="text"
						id="specialties"
						name="specialties"
						bind:value={specialties}
						placeholder="역사, 문화, 음식, 쇼핑 (쉼표로 구분)"
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					/>
					<p class="mt-1 text-xs text-gray-500">쉼표로 구분하여 입력해주세요</p>
				</div>

				<div>
					<label for="experience" class="block text-sm font-medium text-gray-700">
						가이드 경력
					</label>
					<textarea
						id="experience"
						name="experience"
						bind:value={experience}
						rows="3"
						placeholder="가이드 경력과 경험을 작성해주세요"
						class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					></textarea>
				</div>
			</div>
		</div>

		{#if form?.error}
			<div class="mx-4 rounded-lg bg-red-50 p-3">
				<p class="text-sm text-red-600">{form.error}</p>
			</div>
		{/if}

		<!-- Submit Button -->
		<div class="mt-2 bg-white p-4">
			<button
				type="submit"
				disabled={isSubmitting || uploadingImage}
				class="w-full rounded-lg py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-gray-300 {!isSubmitting &&
				!uploadingImage
					? 'bg-blue-600 hover:bg-blue-700'
					: 'bg-gray-300'}"
			>
				{#if isSubmitting || uploadingImage}
					<span class="inline-flex items-center justify-center">
						<svg
							class="mr-2 h-4 w-4 animate-spin text-white"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						{uploadingImage ? '이미지 업로드 중...' : '저장 중...'}
					</span>
				{:else}
					저장하기
				{/if}
			</button>
		</div>
	</form>
</div>

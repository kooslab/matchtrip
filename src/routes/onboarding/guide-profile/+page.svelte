<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Camera } from 'lucide-svelte';
	import DatePickerModal from '$lib/components/DatePickerModal.svelte';

	let selectedYear = $state(1990);
	let selectedMonth = $state(1);
	let selectedDay = $state(1);
	let isLoading = $state(false);
	let error = $state('');
	let profileImageUrl = $state('');
	let uploadingImage = $state(false);
	let residenceArea = $state('');
	let showDatePicker = $state(false);
	let username = $state('');

	// Get current date for validation
	const currentYear = new Date().getFullYear();
	const minYear = currentYear - 100;
	const maxYear = currentYear - 14; // Must be at least 14 years old

	// Generate arrays for picker
	const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
	const months = Array.from({ length: 12 }, (_, i) => i + 1);


	// Simple reactive date display
	const displayDate = $derived(`${selectedYear}년 ${String(selectedMonth).padStart(2, '0')}월 ${String(selectedDay).padStart(2, '0')}일`);

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
		}

		// Pre-fill profile image if exists
		if ($page.data.guideProfile?.profileImageUrl) {
			profileImageUrl = $page.data.guideProfile.profileImageUrl;
		}
	});

	// Handle date picker confirm
	function handleDateConfirm(year: number, month: number, day: number) {
		selectedYear = year;
		selectedMonth = month;
		selectedDay = day;
		showDatePicker = false;
	}

	// Handle date picker cancel
	function handleDateCancel() {
		showDatePicker = false;
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

			// Save guide profile (image, residence, and username)
			const profileData: any = {};
			if (profileImageUrl) {
				profileData.profileImageUrl = profileImageUrl;
			}
			if (residenceArea.trim()) {
				profileData.location = residenceArea.trim();
			}
			if (username.trim()) {
				profileData.username = username.trim();
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

			// Navigate to guide cities page
			await goto('/onboarding/guide-cities');
		} catch (err) {
			error = err instanceof Error ? err.message : '저장에 실패했습니다.';
		} finally {
			isLoading = false;
		}
	}

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

			<!-- Username -->
			<div>
				<label for="username" class="block text-sm font-medium text-gray-700 mb-2">닉네임</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					placeholder="사용하실 닉네임을 입력해주세요"
					class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
					disabled={isLoading}
				/>
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
					onclick={() => showDatePicker = true}
					class="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-left hover:bg-gray-100 transition-colors"
				>
					<div class="text-center text-sm text-gray-600">
						{displayDate}
					</div>
				</button>
			</div>

			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-3">
					<p class="text-sm text-red-600">{error}</p>
				</div>
			{/if}

			<!-- Submit button -->
			<button
				onclick={handleSubmit}
				disabled={isLoading || uploadingImage}
				class="w-full rounded-lg py-3 font-medium text-white transition-colors {!isLoading && !uploadingImage
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

<!-- Date Picker Modal -->
<DatePickerModal 
	showModal={showDatePicker}
	{selectedYear}
	{selectedMonth}
	{selectedDay}
	onConfirm={handleDateConfirm}
	onCancel={handleDateCancel}
/>
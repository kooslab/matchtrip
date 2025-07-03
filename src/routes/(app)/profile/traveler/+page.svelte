<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import {
		User,
		Camera,
		Globe,
		DollarSign,
		Languages,
		Calendar,
		Heart,
		Utensils,
		Phone,
		UserCheck,
		MapPin,
		AlertCircle
	} from 'lucide-svelte';
	import { formatPhoneNumber } from '$lib/utils/phoneFormatter';

	let { data }: { data: PageData } = $props();

	let isEditing = $state(false);
	let isUploading = $state(false);
	let isImageLoading = $state(false);
	let uploadError = $state('');
	let saveError = $state('');
	let isSaving = $state(false);

	// Form data
	let formData = $state({
		phone: data.user.phone || '',
		nationality: data.travelerProfile?.nationality || '',
		travelStyle: data.travelerProfile?.travelStyle || '',
		budgetRange: data.travelerProfile?.budgetRange || '',
		preferredLanguages: data.travelerProfile?.preferredLanguages || [],
		travelFrequency: data.travelerProfile?.travelFrequency || '',
		interests: data.travelerProfile?.interests || [],
		dietaryRestrictions: data.travelerProfile?.dietaryRestrictions || [],
		accessibilityNeeds: data.travelerProfile?.accessibilityNeeds || '',
		emergencyContact: data.travelerProfile?.emergencyContact || '',
		emergencyPhone: data.travelerProfile?.emergencyPhone || '',
		profileImageUrl: data.travelerProfile?.profileImageUrl || ''
	});

	// Available options
	const travelStyles = ['럭셔리', '예산 여행', '모험', '문화 체험', '휴양', '비즈니스'];
	const budgetRanges = ['저예산', '중간', '고급', '초고급'];
	const frequencies = ['연 1회', '연 2-3회', '연 4회 이상', '매월'];
	const languages = ['영어', '한국어', '일본어', '중국어', '스페인어', '프랑스어', '독일어'];
	const interestOptions = [
		'역사',
		'문화',
		'음식',
		'자연',
		'모험',
		'사진',
		'쇼핑',
		'나이트라이프',
		'예술',
		'음악',
		'스포츠',
		'웰니스'
	];
	const dietaryOptions = [
		'채식주의자',
		'비건',
		'글루텐 프리',
		'할랄',
		'코셔',
		'견과류 알레르기',
		'유제품 프리',
		'갑각류 알레르기'
	];

	// Language input
	let languageInput = $state('');

	// Phone number formatting
	function handlePhoneInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const formatted = formatPhoneNumber(target.value);
		formData.phone = formatted;
		target.value = formatted;
	}

	function addLanguage() {
		if (languageInput && !formData.preferredLanguages.includes(languageInput)) {
			formData.preferredLanguages = [...formData.preferredLanguages, languageInput];
			languageInput = '';
		}
	}

	function removeLanguage(lang: string) {
		formData.preferredLanguages = formData.preferredLanguages.filter((l) => l !== lang);
	}

	// Interest toggle
	function toggleInterest(interest: string) {
		if (formData.interests.includes(interest)) {
			formData.interests = formData.interests.filter((i) => i !== interest);
		} else {
			formData.interests = [...formData.interests, interest];
		}
	}

	// Dietary restriction toggle
	function toggleDietary(restriction: string) {
		if (formData.dietaryRestrictions.includes(restriction)) {
			formData.dietaryRestrictions = formData.dietaryRestrictions.filter((d) => d !== restriction);
		} else {
			formData.dietaryRestrictions = [...formData.dietaryRestrictions, restriction];
		}
	}

	async function handleImageUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || !input.files[0]) return;

		const file = input.files[0];
		if (file.size > 5 * 1024 * 1024) {
			uploadError = '파일 크기는 5MB 이하여야 합니다';
			return;
		}

		isUploading = true;
		uploadError = '';

		const uploadData = new FormData();
		uploadData.append('file', file);
		uploadData.append('type', 'traveler-profile');

		try {
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: uploadData
			});

			if (!response.ok) {
				throw new Error('Upload failed');
			}

			const result = await response.json();
			formData.profileImageUrl = result.url;
			// Set image loading state when new URL is assigned
			isImageLoading = true;
		} catch (error) {
			uploadError = '이미지 업로드에 실패했습니다. 다시 시도해주세요.';
		} finally {
			isUploading = false;
		}
	}

	async function saveProfile() {
		isSaving = true;
		saveError = '';

		try {
			const response = await fetch('/api/profile/traveler', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(formData)
			});

			if (!response.ok) {
				throw new Error('Failed to save profile');
			}

			isEditing = false;
		} catch (error) {
			saveError = '프로필 저장에 실패했습니다. 다시 시도해주세요.';
		} finally {
			isSaving = false;
		}
	}

	function getAvatarUrl(name: string) {
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=200`;
	}
</script>

<div class="mx-auto w-full px-3 py-6 sm:max-w-4xl sm:px-4 sm:py-8">
	<div class="mb-6 sm:mb-8">
		<h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">내 프로필</h1>
		<p class="mt-1 text-sm text-gray-600 sm:mt-2 sm:text-base">여행자 프로필 정보를 관리하세요</p>
	</div>

	<div class="rounded-lg bg-white shadow">
		<!-- Profile Header -->
		<div class="border-b border-gray-200 p-3 sm:p-6">
			<div
				class="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
			>
				<div
					class="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-4"
				>
					<!-- Profile Image -->
					<div class="group relative">
						{#if isUploading || isImageLoading}
							<!-- Loading spinner overlay -->
							<div
								class="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-gray-100"
							>
								<div
									class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600"
								></div>
							</div>
						{/if}

						<img
							src={formData.profileImageUrl || getAvatarUrl(data.user.name)}
							alt="Profile"
							class="h-24 w-24 rounded-full object-cover transition-all {isUploading ||
							isImageLoading
								? 'opacity-50'
								: ''}"
							onload={() => {
								isImageLoading = false;
							}}
							onerror={() => {
								isImageLoading = false;
								uploadError = '이미지를 불러올 수 없습니다.';
							}}
						/>

						{#if isEditing && !isUploading && !isImageLoading}
							<label
								class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full transition-opacity"
								style="background-color: rgba(0, 0, 0, 0.4);"
							>
								<div class="text-center">
									<Camera class="mx-auto h-6 w-6 text-white drop-shadow-lg" />
									<span class="mt-1 block text-xs font-medium text-white drop-shadow-lg">수정</span>
								</div>
								<input
									type="file"
									accept="image/*"
									class="hidden"
									onchange={handleImageUpload}
									disabled={isUploading || isImageLoading}
								/>
							</label>
						{/if}
					</div>

					<!-- Basic Info -->
					<div class="text-center sm:text-left">
						<h2 class="text-xl font-semibold text-gray-900 sm:text-2xl">{data.user.name}</h2>
						<p class="text-sm text-gray-600 sm:text-base">{data.user.email}</p>
						<div class="mt-1">
							{#if isEditing}
								<div class="flex items-center justify-center sm:justify-start">
									<Phone class="mr-1 h-4 w-4 text-gray-600" />
									<input
										type="tel"
										value={formData.phone}
										oninput={handlePhoneInput}
										placeholder="010-0000-0000"
										maxlength="13"
										class="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									/>
								</div>
							{:else if formData.phone}
								<p class="text-sm text-gray-600">
									<Phone class="mr-1 inline h-4 w-4" />
									{formData.phone}
								</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Edit Button -->
				<div class="flex justify-center sm:justify-start">
					{#if !isEditing}
						<button
							onclick={() => (isEditing = true)}
							class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
						>
							프로필 수정
						</button>
					{:else}
						<div class="flex space-x-2">
							<button
								onclick={() => (isEditing = false)}
								class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:text-base"
							>
								취소
							</button>
							<button
								onclick={saveProfile}
								disabled={isSaving}
								class="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50 sm:text-base"
							>
								{isSaving ? '저장 중...' : '저장'}
							</button>
						</div>
					{/if}
				</div>
			</div>

			{#if uploadError}
				<p class="mt-2 text-sm text-red-600">{uploadError}</p>
			{/if}
			{#if saveError}
				<p class="mt-2 text-sm text-red-600">{saveError}</p>
			{/if}
		</div>

		<!-- Profile Content -->
		<div class="space-y-6 p-3 sm:p-6">
			<!-- Travel Information -->
			<div class="space-y-4">
				<h3 class="text-lg font-semibold text-gray-900">여행 정보</h3>

				<!-- Nationality -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<Globe class="mr-2 h-4 w-4" />
						국적
					</label>
					{#if isEditing}
						<input
							type="text"
							bind:value={formData.nationality}
							class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="예: 한국, 미국"
						/>
					{:else}
						<p class="mt-1 text-gray-900">{formData.nationality || '미지정'}</p>
					{/if}
				</div>

				<!-- Travel Style -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<MapPin class="mr-2 h-4 w-4" />
						여행 스타일
					</label>
					{#if isEditing}
						<select
							bind:value={formData.travelStyle}
							class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						>
							<option value="">여행 스타일 선택</option>
							{#each travelStyles as style}
								<option value={style}>{style}</option>
							{/each}
						</select>
					{:else}
						<p class="mt-1 text-gray-900">{formData.travelStyle || '미지정'}</p>
					{/if}
				</div>

				<!-- Budget Range -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<DollarSign class="mr-2 h-4 w-4" />
						예산 범위
					</label>
					{#if isEditing}
						<select
							bind:value={formData.budgetRange}
							class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						>
							<option value="">예산 범위 선택</option>
							{#each budgetRanges as range}
								<option value={range}>{range}</option>
							{/each}
						</select>
					{:else}
						<p class="mt-1 text-gray-900">{formData.budgetRange || '미지정'}</p>
					{/if}
				</div>

				<!-- Travel Frequency -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<Calendar class="mr-2 h-4 w-4" />
						여행 빈도
					</label>
					{#if isEditing}
						<select
							bind:value={formData.travelFrequency}
							class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						>
							<option value="">빈도 선택</option>
							{#each frequencies as freq}
								<option value={freq}>{freq}</option>
							{/each}
						</select>
					{:else}
						<p class="mt-1 text-gray-900">{formData.travelFrequency || '미지정'}</p>
					{/if}
				</div>

				<!-- Preferred Languages -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<Languages class="mr-2 h-4 w-4" />
						선호 언어
					</label>
					{#if isEditing}
						<div class="mt-1 space-y-2">
							<div class="flex space-x-2">
								<select
									bind:value={languageInput}
									class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								>
									<option value="">언어 선택</option>
									{#each languages as lang}
										<option value={lang}>{lang}</option>
									{/each}
								</select>
								<button
									onclick={addLanguage}
									type="button"
									class="rounded-md bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
								>
									추가
								</button>
							</div>
							<div class="flex flex-wrap gap-2">
								{#each formData.preferredLanguages as lang}
									<span
										class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-800"
									>
										{lang}
										<button
											onclick={() => removeLanguage(lang)}
											class="ml-2 text-indigo-600 hover:text-indigo-800"
										>
											×
										</button>
									</span>
								{/each}
							</div>
						</div>
					{:else}
						<div class="mt-1 flex flex-wrap gap-2">
							{#if formData.preferredLanguages.length > 0}
								{#each formData.preferredLanguages as lang}
									<span class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
										{lang}
									</span>
								{/each}
							{:else}
								<p class="text-gray-900">미지정</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Interests -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<Heart class="mr-2 h-4 w-4" />
						관심사
					</label>
					{#if isEditing}
						<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
							{#each interestOptions as interest}
								<button
									type="button"
									onclick={() => toggleInterest(interest)}
									class="rounded-md border px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm {formData.interests.includes(
										interest
									)
										? 'border-indigo-600 bg-indigo-50 text-indigo-600'
										: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
								>
									{interest}
								</button>
							{/each}
						</div>
					{:else}
						<div class="mt-1 flex flex-wrap gap-2">
							{#if formData.interests.length > 0}
								{#each formData.interests as interest}
									<span class="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-800">
										{interest}
									</span>
								{/each}
							{:else}
								<p class="text-gray-900">미지정</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Dietary & Accessibility -->
			<div class="space-y-4 border-t pt-6">
				<h3 class="text-lg font-semibold text-gray-900">식단 및 접근성</h3>

				<!-- Dietary Restrictions -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<Utensils class="mr-2 h-4 w-4" />
						식이 제한
					</label>
					{#if isEditing}
						<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
							{#each dietaryOptions as restriction}
								<button
									type="button"
									onclick={() => toggleDietary(restriction)}
									class="rounded-md border px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm {formData.dietaryRestrictions.includes(
										restriction
									)
										? 'border-indigo-600 bg-indigo-50 text-indigo-600'
										: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}"
								>
									{restriction}
								</button>
							{/each}
						</div>
					{:else}
						<div class="mt-1 flex flex-wrap gap-2">
							{#if formData.dietaryRestrictions.length > 0}
								{#each formData.dietaryRestrictions as restriction}
									<span class="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
										{restriction}
									</span>
								{/each}
							{:else}
								<p class="text-gray-900">없음</p>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Accessibility Needs -->
				<div>
					<label class="flex items-center text-sm font-medium text-gray-700">
						<UserCheck class="mr-2 h-4 w-4" />
						접근성 요구사항
					</label>
					{#if isEditing}
						<textarea
							bind:value={formData.accessibilityNeeds}
							rows="3"
							class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="특별한 접근성 요구사항이 있으면 입력하세요..."
						></textarea>
					{:else}
						<p class="mt-1 text-gray-900">{formData.accessibilityNeeds || '없음'}</p>
					{/if}
				</div>
			</div>

			<!-- Emergency Contact -->
			<div class="space-y-4 border-t pt-6">
				<h3 class="flex items-center text-lg font-semibold text-gray-900">
					<AlertCircle class="mr-2 h-5 w-5" />
					비상 연락처
				</h3>

				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<label class="text-sm font-medium text-gray-700">연락처 이름</label>
						{#if isEditing}
							<input
								type="text"
								bind:value={formData.emergencyContact}
								class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="비상 연락처 이름"
							/>
						{:else}
							<p class="mt-1 text-gray-900">{formData.emergencyContact || '미지정'}</p>
						{/if}
					</div>

					<div>
						<label class="text-sm font-medium text-gray-700">연락처 전화번호</label>
						{#if isEditing}
							<input
								type="tel"
								bind:value={formData.emergencyPhone}
								class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="비상 연락처 전화번호"
							/>
						{:else}
							<p class="mt-1 text-gray-900">{formData.emergencyPhone || '미지정'}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

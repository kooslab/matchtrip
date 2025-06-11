<script lang="ts">
	import Editor from '@tinymce/tinymce-svelte';
	import { Camera } from 'lucide-svelte';
	export let data: { userName: string; userRole: string; guideProfile: any };

	console.log('data', data);

	// Import any auth/user context to determine if the user is the guide
	type GuideProfile = { introduction: any; profileImageUrl?: string };
	let isGuide = data.userRole === 'guide';
	let profile: GuideProfile | null = data.guideProfile || null;
	let editMode = false;
	let bio = profile?.introduction || '';
	let profileImageUrl = profile?.profileImageUrl || '';

	let isMobile = false;
	let saving = false;
	let saveError = '';
	let uploadingImage = false;

	// Generate avatar placeholder
	function getAvatarUrl(name: string) {
		const initials = name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase();
		return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200&font-size=0.4&bold=true`;
	}

	// TinyMCE config (copy from /offers)
	const editorConfig = {
		height: isMobile ? 300 : 400,
		menubar: false,
		language: 'ko_KR',
		mobile: {
			theme: 'silver',
			plugins: ['lists', 'autolink', 'link', 'image'],
			toolbar_mode: 'wrap'
		},
		plugins: ['lists', 'autolink', 'link', 'preview', 'visualblocks', 'wordcount', 'image'],
		toolbar_mode: 'wrap',
		toolbar: isMobile
			? [
					'undo redo | bold italic underline',
					'bullist numlist | outdent indent',
					'link image | removeformat | preview'
				].join(' | ')
			: 'undo redo | blocks | bold italic underline | bullist numlist outdent indent | link image removeformat | preview',
		content_style:
			'body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; line-height: 1.6; padding: 8px; }',
		branding: false,
		resize: false,
		statusbar: false,
		toolbar_sticky: false,
		setup: (editor: any) => {
			editor.on('init', () => {
				if (isMobile) {
					editor.getBody().style.fontSize = '16px';
					editor.getBody().style.minHeight = '200px';
				}
			});
		},
		images_upload_handler: handleTinyMCEImageUpload,
		images_upload_base_path: '/api/upload',
		automatic_uploads: true,
		file_picker_types: 'image',
		convert_urls: false,
		relative_urls: false,
		remove_script_host: false,
		image_caption: true,
		image_advtab: true,
		image_title: true,
		image_description: true,
		image_dimensions: true,
		image_upload_credentials: true,
		file_picker_callback: function(callback: any, value: any, meta: any) {
			if (meta.filetype === 'image') {
				const input = document.createElement('input');
				input.setAttribute('type', 'file');
				input.setAttribute('accept', 'image/*');
				
				input.onchange = function() {
					const file = (input as any).files[0];
					const reader = new FileReader();
					
					reader.onload = function() {
						const id = 'blobid' + (new Date()).getTime();
						const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache;
						const base64 = (reader.result as string).split(',')[1];
						const blobInfo = blobCache.create(id, file, base64);
						blobCache.add(blobInfo);
						
						callback(blobInfo.blobUri(), { title: file.name });
					};
					reader.readAsDataURL(file);
				};
				
				input.click();
			}
		}
	};

	async function handleSave() {
		saving = true;
		saveError = '';
		try {
			const res = await fetch('/api/profile/guide', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					introduction: bio,
					profileImageUrl: profileImageUrl 
				})
			});
			const data = await res.json();
			if (data.success) {
				profile = { 
					introduction: bio,
					profileImageUrl: profileImageUrl 
				};
				editMode = false;
			} else {
				saveError = data.error || 'Failed to save.';
			}
		} catch (err) {
			saveError = 'Server error.';
		} finally {
			saving = false;
		}
	}
	function handleEdit() {
		editMode = true;
	}
	function handleCancel() {
		editMode = false;
	}
	async function handleTinyMCEImageUpload(blobInfo: any, progress: any) {
		try {
			const file = blobInfo.blob();
			const formData = new FormData();
			formData.append('file', file, blobInfo.filename());
			formData.append('type', 'guide-profile');

			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || 'Upload failed');
			}

			const result = await response.json();
			if (result.success && result.url) {
				return result.url;
			} else {
				throw new Error('Upload failed - no URL returned');
			}
		} catch (error) {
			console.error('Image upload error:', error);
			throw error;
		}
	}
	
	function handleProfileImageUpload() {
		const fileInput = document.getElementById('profile-image-input') as HTMLInputElement;
		fileInput?.click();
	}
	
	async function handleImageFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('이미지 파일만 업로드할 수 있습니다.');
			return;
		}
		
		// Validate file size (5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('파일 크기는 5MB 이하여야 합니다.');
			return;
		}
		
		uploadingImage = true;
		
		try {
			// Upload image
			const formData = new FormData();
			formData.append('file', file);
			formData.append('type', 'guide-profile');
			
			const uploadResponse = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});
			
			if (!uploadResponse.ok) {
				const error = await uploadResponse.json();
				throw new Error(error.error || '업로드 실패');
			}
			
			const uploadResult = await uploadResponse.json();
			if (!uploadResult.success || !uploadResult.url) {
				throw new Error('업로드 실패 - URL이 반환되지 않았습니다.');
			}
			
			// Save profile image URL to database
			const saveResponse = await fetch('/api/profile/guide', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					introduction: profile?.introduction || '',
					profileImageUrl: uploadResult.url 
				})
			});
			
			const saveResult = await saveResponse.json();
			if (saveResult.success) {
				profileImageUrl = uploadResult.url;
				if (profile) {
					profile.profileImageUrl = uploadResult.url;
				}
			} else {
				throw new Error('프로필 이미지 저장 실패');
			}
		} catch (error) {
			console.error('이미지 업로드 오류:', error);
			alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
		} finally {
			uploadingImage = false;
			// Reset file input
			input.value = '';
		}
	}
</script>

<style>
	.rich-content :global(img) {
		max-width: 100%;
		height: auto;
		border-radius: 0.5rem;
		margin: 1rem 0;
	}
	.rich-content :global(p) {
		margin-bottom: 1rem;
	}
	.rich-content :global(h1),
	.rich-content :global(h2),
	.rich-content :global(h3) {
		font-weight: bold;
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
	}
	.rich-content :global(ul),
	.rich-content :global(ol) {
		margin-left: 1.5rem;
		margin-bottom: 1rem;
	}
</style>

<div class="flex min-h-[80vh] flex-col items-center bg-gray-50 py-10">
	<div class="w-full max-w-2xl">
		<h1 class="mb-6 text-center text-4xl font-extrabold">가이드 프로필</h1>
		
		{#if !editMode}
			<!-- View Mode -->
			<div class="mb-8 rounded-2xl bg-white p-8 shadow-lg">
				<!-- Profile Image Display -->
				<div class="mb-6 flex flex-col items-center">
					{#if isGuide}
						<div class="group relative cursor-pointer" onclick={handleProfileImageUpload}>
							<img
								src={profileImageUrl || getAvatarUrl(data.userName)}
								alt="프로필 이미지"
								class="h-32 w-32 rounded-full object-cover shadow-lg transition-all group-hover:opacity-75"
							/>
							<div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
								<div class="text-center">
									{#if uploadingImage}
										<div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
										<p class="mt-2 text-xs text-white">업로드 중...</p>
									{:else}
										<Camera size={32} class="mx-auto text-white" />
										<p class="mt-2 text-xs text-white">사진 변경</p>
									{/if}
								</div>
							</div>
						</div>
						<input
							type="file"
							id="profile-image-input"
							accept="image/*"
							class="hidden"
							onchange={handleImageFileSelect}
						/>
					{:else}
						<img
							src={profileImageUrl || getAvatarUrl(data.userName)}
							alt="프로필 이미지"
							class="h-32 w-32 rounded-full object-cover shadow-lg"
						/>
					{/if}
				</div>
				<div class="mb-4 text-center">
					<h2 class="text-2xl font-bold">{data.userName}</h2>
				</div>
				
				<!-- Content Section with Edit Button -->
				<div class="relative">
					{#if isGuide}
						<button
							onclick={handleEdit}
							class="absolute -top-2 right-0 flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-pink-600 hover:shadow-lg"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
							</svg>
							프로필 수정
						</button>
					{/if}
					
					<div class="mb-4">
						{#if profile && profile.introduction}
							<div class="prose prose-neutral max-w-none rich-content">
								{@html profile.introduction}
							</div>
						{:else}
							<div class="text-gray-400">가이드 소개가 없습니다.</div>
						{/if}
					</div>
				</div>
				
				<!-- Reviews Section -->
				<div class="mt-8 rounded-2xl bg-white p-8 shadow-lg">
					<h3 class="mb-6 text-xl font-bold">여행자 리뷰</h3>
					<div class="space-y-4">
						<!-- Review 1 -->
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
							<div class="mb-2 flex items-start justify-between">
								<div>
									<p class="font-semibold">김민수</p>
									<div class="flex items-center gap-1">
										{#each Array(5) as _, i}
											<svg class="h-4 w-4 {i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
											</svg>
										{/each}
										<span class="ml-1 text-sm text-gray-600">5.0</span>
									</div>
								</div>
								<span class="text-sm text-gray-500">2024년 1월 15일</span>
							</div>
							<p class="text-gray-700">정말 최고의 가이드였습니다! 현지 문화와 역사에 대한 깊은 지식을 바탕으로 재미있게 설명해주셔서 시간 가는 줄 몰랐어요. 특히 숨겨진 맛집들을 소개해주신 것이 인상적이었습니다.</p>
						</div>
						
						<!-- Review 2 -->
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
							<div class="mb-2 flex items-start justify-between">
								<div>
									<p class="font-semibold">이서연</p>
									<div class="flex items-center gap-1">
										{#each Array(5) as _, i}
											<svg class="h-4 w-4 {i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
											</svg>
										{/each}
										<span class="ml-1 text-sm text-gray-600">4.0</span>
									</div>
								</div>
								<span class="text-sm text-gray-500">2024년 1월 10일</span>
							</div>
							<p class="text-gray-700">친절하고 세심한 가이드님이었어요. 사진도 잘 찍어주시고 일정 관리도 완벽했습니다. 다만 조금 더 자유시간이 있었으면 좋았을 것 같아요.</p>
						</div>
						
						<!-- Review 3 -->
						<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
							<div class="mb-2 flex items-start justify-between">
								<div>
									<p class="font-semibold">박준호</p>
									<div class="flex items-center gap-1">
										{#each Array(5) as _, i}
											<svg class="h-4 w-4 {i < 5 ? 'text-yellow-400 fill-current' : 'text-gray-300'}" viewBox="0 0 20 20">
												<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
											</svg>
										{/each}
										<span class="ml-1 text-sm text-gray-600">5.0</span>
									</div>
								</div>
								<span class="text-sm text-gray-500">2023년 12월 28일</span>
							</div>
							<p class="text-gray-700">가족 여행이었는데 아이들 눈높이에 맞춰서 설명해주시고 배려해주셔서 정말 감사했습니다. 현지인만 아는 특별한 장소들도 많이 보여주셔서 잊지 못할 추억이 되었어요!</p>
						</div>
					</div>
				</div>
			</div>
		{:else if isGuide && editMode}
			<!-- Edit Mode -->
			<div class="mb-8 rounded-2xl bg-white p-8 shadow-lg">
				<!-- Profile Image Edit -->
				<div class="mb-6 flex flex-col items-center">
					<div class="relative">
						<img
							src={profileImageUrl || getAvatarUrl(data.userName)}
							alt="프로필 이미지"
							class="h-32 w-32 rounded-full object-cover shadow-lg"
						/>
						<button
							onclick={handleProfileImageUpload}
							disabled={uploadingImage}
							class="absolute bottom-0 right-0 rounded-full bg-pink-500 p-2 text-white shadow-lg hover:bg-pink-600 disabled:opacity-50"
						>
							{#if uploadingImage}
								<div class="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
							{:else}
								<Camera size={20} />
							{/if}
						</button>
					</div>
					<input
						type="file"
						id="profile-image-input"
						accept="image/*"
						class="hidden"
						onchange={handleImageFileSelect}
					/>
				</div>
				<div class="mb-4 text-center">
					<h2 class="text-2xl font-bold">{data.userName}</h2>
				</div>
				<div class="mb-4">
					<Editor
						apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
						conf={editorConfig}
						bind:value={bio} />
				</div>
				<div class="flex justify-end gap-2">
					<button class="btn btn-secondary" onclick={handleCancel}>취소</button>
					<button class="btn btn-primary" onclick={handleSave} disabled={saving}
						>{saving ? '저장 중...' : '저장'}</button>
				</div>
				{#if saveError}<div class="mt-2 text-red-500">{saveError}</div>{/if}
			</div>
		{/if}
	</div>
</div>

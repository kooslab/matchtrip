<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';

	let { data } = $props();

	let nickname = $state(data.travelerProfile?.username || '');
	let name = $state(data.user?.name || '');
	let email = $state(data.user?.email || '');
	let profileImageUrl = $state(data.user?.image || data.travelerProfile?.profileImageUrl || '');
	let uploadingImage = $state(false);
	let isSaving = $state(false);

	const handleBack = () => {
		goto('/profile/traveler');
	};

	const handleImageClick = () => {
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
	};

	const handleSubmit = async () => {
		isSaving = true;
		
		try {
			// Update user basic info
			const userResponse = await fetch('/api/user/profile', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name,
					image: profileImageUrl || null
				})
			});

			if (!userResponse.ok) {
				const error = await userResponse.json();
				alert(error.error || '프로필 업데이트에 실패했습니다.');
				return;
			}

			// Update traveler profile
			const travelerResponse = await fetch('/api/profile/traveler', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					username: nickname,
					profileImageUrl: profileImageUrl || null
				})
			});

			if (!travelerResponse.ok) {
				const error = await travelerResponse.json();
				alert(error.error || '여행자 프로필 업데이트에 실패했습니다.');
				return;
			}

			goto('/profile/traveler');
		} catch (error) {
			console.error('Error updating profile:', error);
			alert('프로필 업데이트 중 오류가 발생했습니다.');
		} finally {
			isSaving = false;
		}
	};
</script>

<svelte:head>
	<title>프로필 수정 | Matchtrip</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50 pb-20">
	<!-- Header -->
	<header class="sticky top-0 z-10 bg-white shadow-sm">
		<div class="flex items-center px-4 py-4">
			<button onclick={handleBack} class="-ml-2 p-2">
				<ArrowLeft class="h-6 w-6 text-gray-600" />
			</button>
			<h1 class="ml-2 text-lg font-semibold">프로필 수정</h1>
		</div>
	</header>

	<!-- Form Content -->
	<div class="flex-1 p-4">
		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="space-y-6"
		>
			<!-- Profile Image -->
			<div class="flex flex-col items-center">
				<div class="relative mb-4">
					{#if profileImageUrl}
						<img
							src={profileImageUrl}
							alt="프로필 이미지"
							class="h-24 w-24 rounded-full object-cover"
						/>
					{:else}
						<div class="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
							<svg class="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
								/>
							</svg>
						</div>
					{/if}
					
					{#if uploadingImage}
						<div class="absolute inset-0 flex h-24 w-24 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm">
							<div class="flex flex-col items-center gap-1">
								<div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
								<span class="text-[10px] text-gray-600">업로드 중</span>
							</div>
						</div>
					{/if}
				</div>
				<button 
					type="button" 
					onclick={handleImageClick}
					disabled={uploadingImage}
					class="text-sm {uploadingImage ? 'cursor-wait text-gray-400' : 'text-blue-500 hover:underline'}"
				>
					{uploadingImage ? '업로드 중...' : '프로필 사진 변경'}
				</button>
			</div>

			<!-- Form Fields -->
			<div class="space-y-4">
				<div>
					<label for="nickname" class="mb-1 block text-sm font-medium text-gray-700">
						닉네임
					</label>
					<input
						id="nickname"
						type="text"
						bind:value={nickname}
						class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						placeholder="닉네임을 입력하세요"
					/>
				</div>

				<div>
					<label for="name" class="mb-1 block text-sm font-medium text-gray-700"> 이름 </label>
					<input
						id="name"
						type="text"
						bind:value={name}
						class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						placeholder="이름을 입력하세요"
					/>
				</div>

				<div>
					<label for="email" class="mb-1 block text-sm font-medium text-gray-700"> 이메일 </label>
					<input
						id="email"
						type="email"
						bind:value={email}
						readonly
						class="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-3 text-gray-500"
					/>
					<p class="mt-1 text-xs text-gray-500">이메일은 변경할 수 없습니다.</p>
				</div>
			</div>

			<!-- Submit Button -->
			<button
				type="submit"
				disabled={isSaving}
				class="w-full rounded-lg bg-blue-500 py-3 font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isSaving ? '저장 중...' : '저장하기'}
			</button>
		</form>
	</div>
</div>

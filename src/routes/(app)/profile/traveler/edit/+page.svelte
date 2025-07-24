<script lang="ts">
	import { goto } from '$app/navigation';
	import { ArrowLeft } from 'lucide-svelte';

	let { data } = $props();

	let nickname = $state(data.user?.nickname || '');
	let name = $state(data.user?.name || '');
	let email = $state(data.user?.email || '');
	let profileImageUrl = $state(data.user?.profileImageUrl || '');

	const handleBack = () => {
		goto('/profile/traveler');
	};

	const handleSubmit = async () => {
		// TODO: Implement profile update logic
		console.log('Profile update:', { nickname, name, email, profileImageUrl });
		goto('/profile/traveler');
	};
</script>

<svelte:head>
	<title>프로필 수정 | Matchtrip</title>
</svelte:head>

<div class="flex flex-col min-h-screen bg-gray-50 pb-20">
	<!-- Header -->
	<header class="bg-white shadow-sm sticky top-0 z-10">
		<div class="flex items-center px-4 py-4">
			<button onclick={handleBack} class="p-2 -ml-2">
				<ArrowLeft class="h-6 w-6 text-gray-600" />
			</button>
			<h1 class="text-lg font-semibold ml-2">프로필 수정</h1>
		</div>
	</header>

	<!-- Form Content -->
	<div class="flex-1 p-4">
		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
			<!-- Profile Image -->
			<div class="flex flex-col items-center">
				<img
					src={profileImageUrl || 'https://via.placeholder.com/150'}
					alt="프로필 이미지"
					class="w-24 h-24 rounded-full object-cover mb-4"
				/>
				<button type="button" class="text-blue-500 text-sm hover:underline">
					프로필 사진 변경
				</button>
			</div>

			<!-- Form Fields -->
			<div class="space-y-4">
				<div>
					<label for="nickname" class="block text-sm font-medium text-gray-700 mb-1">
						닉네임
					</label>
					<input
						id="nickname"
						type="text"
						bind:value={nickname}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="닉네임을 입력하세요"
					/>
				</div>

				<div>
					<label for="name" class="block text-sm font-medium text-gray-700 mb-1">
						이름
					</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="이름을 입력하세요"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						이메일
					</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						readonly
						class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
					/>
					<p class="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
				</div>
			</div>

			<!-- Submit Button -->
			<button
				type="submit"
				class="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
			>
				저장하기
			</button>
		</form>
	</div>
</div>